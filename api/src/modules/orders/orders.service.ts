import { iOrder, iCartItem, iCartAddon, OrderModel, OrderStatus } from './orders.model'
import * as CouponService from '../coupons/coupons.services'
import * as ProductService from '../productos/products.service'
import * as AdicionalService from '../adicionales/adicionales.service'
import { updateAnalyticsOnDelivery, revertAnalyticsOnDelivery } from '../analytics/analytics.service'
import { checkStoreStatus } from '../Schedules/Schedule.service'
import { calculateDelivery } from '../delivery/delivery.service'
import { AppError } from '../../utils/AppError'
import { argToUTC } from '../../utils/Timezone'
import { Range, getRangeStartDate } from '../../utils/dateRange'

// Recargo del 15% por pago con tarjeta de crédito, sobre la base neta (subtotal - descuentos + envío)
const applyCreditSurcharge = (baseTotal: number, paymentMethod: string): { total: number; surcharge: number } => {
  const surcharge = paymentMethod === 'credito' ? Math.round(baseTotal * 0.15) : 0
  return { total: baseTotal + surcharge, surcharge }
}

export const createOrder = async (orderData: any): Promise<iOrder> => {
 
  const storeStatus = await checkStoreStatus()
  if (!storeStatus.isOpen) {
    // 423 (Locked) y no 403: el 403 está reservado por el middleware de auth para token inválido/expirado,
    // y el interceptor del front desloguea ante cualquier 403. "Local cerrado" es una regla de negocio, no un tema de sesión.
    throw new AppError(423, storeStatus.message || 'El negocio está cerrado en este momento')
  }
 
  const items: iCartItem[] = await Promise.all(
    orderData.items.map(async (item: any) => {
 
      const product = await ProductService.viewById(item.productId)
      if (!product) throw new AppError(404, `Producto ${item.productId} no encontrado`)
 
      if (product.controlStock) {
        if (product.stock <= 0) {
          throw new AppError(400, `El producto "${product.title}" se encuentra agotado`)
        }
        if (item.quantity > product.stock) {
          throw new AppError(400, `Stock insuficiente para "${product.title}". Disponibles: ${product.stock}, solicitados: ${item.quantity}`)
        }
        
        product.stock -= item.quantity
        await product.save()
      }

      let addons: iCartAddon[] = []
      if (item.addons && item.addons.length > 0) {
        addons = await Promise.all(
          item.addons.map(async (a: any) => {
            const adicional = await AdicionalService.viewById(a.addonId)
            if (!adicional) throw new AppError(404, `Adicional ${a.addonId} no encontrado`)
            const addonName = adicional.title ?? 'Adicional'
            return {
              addonId:  a.addonId,
              title:    addonName,
              name:     addonName,
              price:    adicional.price,
              quantity: a.quantity
            }
          })
        )
      }
 
      return {
        productId: item.productId,
        title:     product.title,
        price:     product.price,
        quantity:  item.quantity,
        addons
      }
    })
  )

  const subTotal = items.reduce((acc, item) => {
    const itemTotal   = item.price * item.quantity
    const addonsTotal = (item.addons || []).reduce((a, addon) => a + addon.price * addon.quantity, 0)
    return acc + itemTotal + addonsTotal
  }, 0)
 
  let total = subTotal
  let discountPercent = 0
  if (orderData.couponCode) {
    const coupon = await CouponService.search(orderData.couponCode)
    if (!coupon) throw new AppError(404, 'El cupón ingresado no es válido o ya no existe')
    
    const couponError = CouponService.validateCoupon(coupon, orderData.paymentMethod, orderData.deliveryType);
    if (couponError) {
      throw new AppError(400, couponError);
    }
    
    discountPercent = coupon.discountPercent
    const discount = (subTotal * discountPercent) / 100
    total = subTotal - discount
  }

  let deliveryCost = 0
  let delivery = orderData.delivery

  if (orderData.deliveryType === 'delivery') {
    const coordinates = orderData.delivery?.coordinates
    if (typeof coordinates?.lat !== 'number' || typeof coordinates?.lng !== 'number') {
      throw new AppError(400, 'Las coordenadas son obligatorias para envíos')
    }

    const deliveryCalculation = await calculateDelivery(coordinates.lat, coordinates.lng)
    deliveryCost = deliveryCalculation.deliveryCost
    delivery = {
      address: orderData.delivery?.address ?? orderData.customer?.address,
      coordinates,
      distanceKm: deliveryCalculation.distanceKm
    }
    total += deliveryCost
  }

  // 🔥 RECARGO POR TARJETA DE CRÉDITO (15%)
  const surchargeResult = applyCreditSurcharge(total, orderData.paymentMethod)
  total = surchargeResult.total
  const surcharge = surchargeResult.surcharge

  let sanitizedNotes = '';
  if (orderData.notes && typeof orderData.notes === 'string') {
    sanitizedNotes = orderData.notes
      .trim()
      .substring(0, 300)
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-zA-Z0-9\s.,!¡?¿()\-áéíóúñÁÉÍÓÚÑ]/g, ''); 
  }
 
  const newOrder = new OrderModel({
    customer:      orderData.customer,
    items,
    deliveryType:  orderData.deliveryType,
    paymentMethod: orderData.paymentMethod,
    couponCode:    orderData.couponCode,
    discountPercent,
    subtotal:      subTotal,
    deliveryCost,
    surcharge, // NUEVO: Guardamos el recargo aplicado
    delivery,
    total:         Math.max(0, total),
    notes:         sanitizedNotes
  })
 
  const saved = await newOrder.save()
  console.log(`[PEDIDO] Nuevo pedido ${saved._id} - ${saved.customer.name} - $${saved.total}`)
  return saved
}

export const getAllOrders = async (): Promise<iOrder[]> => {
  return await OrderModel.find().sort({ createdAt: -1 })
}

export const getOrdersRange = async (range: Range): Promise<iOrder[]> => {
  const start = argToUTC(getRangeStartDate(range));

  const filter: any = { $gte: start };
  if (range === 'ayer') filter.$lt = argToUTC(getRangeStartDate('hoy'));

  return await OrderModel.find({ createdAt: filter }).lean().sort({ createdAt: -1 });
}

// Reemplazar la función update en orders.service.ts

export const update = async (
  id: string,
  newStatus: OrderStatus,
  newDeliveryCost?: number   
): Promise<iOrder | null> => {
  const oldOrder = await OrderModel.findById(id);
  if (!oldOrder) return null;

  const oldStatus = oldOrder.status;

  const updateData: Record<string, any> = {};
  if (newStatus !== undefined) updateData.status = newStatus;

  // Si viene un nuevo costo de envío, recalcular el total respetando el recargo si hubo crédito
  if (newDeliveryCost !== undefined) {
    updateData.deliveryCost = newDeliveryCost;
    
    const discount = (oldOrder.subtotal * oldOrder.discountPercent) / 100;
    let baseTotal = oldOrder.subtotal - discount + newDeliveryCost;
    
    // Si pagó con crédito, recalculamos también el recargo del 15% en base al nuevo total base
    const recalculated = applyCreditSurcharge(baseTotal, oldOrder.paymentMethod);
    updateData.surcharge = recalculated.surcharge;

    updateData.total = Math.max(0, recalculated.total);
  }

  const updatedOrder = await OrderModel.findByIdAndUpdate(
    id,
    updateData,
    { returnDocument: 'after' }
  );

  if (!updatedOrder) return null;

  if (newStatus) {
    console.log(`[PEDIDO] Pedido ${updatedOrder._id} actualizado de "${oldStatus}" a "${newStatus}"`);
  }
  if (newDeliveryCost !== undefined) {
    console.log(`[PEDIDO] Costo de envío actualizado a $${newDeliveryCost} → Total: $${updatedOrder.total}`);
  }

  if (newStatus && oldStatus !== 'delivered' && newStatus === 'delivered') {
    await updateAnalyticsOnDelivery(updatedOrder);
  }
  if (newStatus && oldStatus === 'delivered' && newStatus !== 'delivered') {
    await revertAnalyticsOnDelivery(updatedOrder);
  }

  if (newStatus && oldStatus !== 'cancelled' && newStatus === 'cancelled') {
    console.log(`[STOCK] Devolviendo stock por cancelacion del pedido ${updatedOrder._id}`);
    for (const item of oldOrder.items) {
      const product = await ProductService.viewById(item.productId);
      if (product && product.controlStock) {
        product.stock += item.quantity;
        await product.save();
        console.log(`   -> Repuesto "${product.title}": +${item.quantity} (Nuevo Stock: ${product.stock})`);
      }
    }
  }

  return updatedOrder;
};