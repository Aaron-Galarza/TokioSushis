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
import mongoose, { type ClientSession } from 'mongoose'
import { ProductModel } from '../productos/products.model'

// Recargo del 15% por pago con tarjeta de crédito, sobre la base neta (subtotal - descuentos + envío)
const applyCreditSurcharge = (baseTotal: number, paymentMethod: string): { total: number; surcharge: number } => {
  const surcharge = paymentMethod === 'credito' ? Math.round(baseTotal * 0.15) : 0
  return { total: baseTotal + surcharge, surcharge }
}

const restoreStock = async (items: iCartItem[], session: ClientSession): Promise<void> => {
  for (const item of items) {
    await ProductModel.updateOne(
      { _id: item.productId, controlStock: true },
      { $inc: { stock: item.quantity } },
      { session }
    )
  }
}

export const createOrder = async (orderData: any): Promise<iOrder> => {
  const stockRequirements = new Map<string, { title: string; quantity: number }>()
 
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
        
        const previous = stockRequirements.get(item.productId)
        stockRequirements.set(item.productId, {
          title: product.title,
          quantity: (previous?.quantity ?? 0) + item.quantity,
        })
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
    const address = orderData.delivery?.address ?? orderData.customer?.address
    const coordinates = orderData.delivery?.coordinates

    delivery = {
      address,
      ...(coordinates ? { coordinates } : {}),
    }

    const hasCoordinates = typeof coordinates?.lat === 'number' && typeof coordinates?.lng === 'number'

    if (hasCoordinates) {
      try {
        const deliveryCalculation = await calculateDelivery(coordinates.lat, coordinates.lng)
        deliveryCost = deliveryCalculation.deliveryCost
        delivery.distanceKm = deliveryCalculation.distanceKm
        total += deliveryCost
      } catch (error) {
        // 📦 Mapbox no pudo calcular la ruta: el pedido se crea igual y el costo se coordina por WhatsApp
        console.error('[DELIVERY_CALC_ERROR]', error)
      }
    }
  }

  // 🔥 RECARGO POR TARJETA DE CRÉDITO (15%)
  const surchargeResult = applyCreditSurcharge(total, orderData.paymentMethod)
  total = surchargeResult.total
  const surcharge = surchargeResult.surcharge

  const orderPayload = {
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
    notes:         orderData.notes
  }

  const saved = await mongoose.connection.transaction(async session => {
    for (const [productId, requirement] of stockRequirements) {
      const reserved = await ProductModel.findOneAndUpdate(
        { _id: productId, controlStock: true, stock: { $gte: requirement.quantity } },
        { $inc: { stock: -requirement.quantity } },
        { session, returnDocument: 'after' }
      )
      if (!reserved) {
        throw new AppError(400, `Stock insuficiente para "${requirement.title}"`)
      }
    }
    return await new OrderModel(orderPayload).save({ session })
  })
  console.log(`[PEDIDO] Nuevo pedido ${saved._id} - ${saved.customer.name} - $${saved.total}`)
  return saved
}

export const getAllOrders = async (): Promise<iOrder[]> => {
  return await OrderModel.find({ deleted: { $ne: true } }).sort({ createdAt: -1 })
}

export const getOrdersRange = async (range: Range): Promise<iOrder[]> => {
  const start = argToUTC(getRangeStartDate(range));

  const filter: any = { $gte: start };
  if (range === 'ayer') filter.$lt = argToUTC(getRangeStartDate('hoy'));

  return await OrderModel.find({ deleted: { $ne: true }, createdAt: filter }).lean().sort({ createdAt: -1 });
}

// Reemplazar la función update en orders.service.ts

export const update = async (
  id: string,
  newStatus: OrderStatus,
  newDeliveryCost?: number   
): Promise<iOrder | null> => {
  return mongoose.connection.transaction(async session => {
    const oldOrder = await OrderModel.findById(id).session(session);
    if (!oldOrder || oldOrder.deleted) return null;

    const oldStatus = oldOrder.status;
    if (oldStatus === 'cancelled' && newStatus && newStatus !== 'cancelled') {
      throw new AppError(409, 'Un pedido cancelado no puede reabrirse')
    }
    const updateData: Record<string, number | OrderStatus> = {};
    if (newStatus !== undefined) updateData.status = newStatus;

    if (newDeliveryCost !== undefined) {
      updateData.deliveryCost = newDeliveryCost;
      const discount = (oldOrder.subtotal * oldOrder.discountPercent) / 100;
      const baseTotal = oldOrder.subtotal - discount + newDeliveryCost;
      const recalculated = applyCreditSurcharge(baseTotal, oldOrder.paymentMethod);
      updateData.surcharge = recalculated.surcharge;
      updateData.total = Math.max(0, recalculated.total);
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after', session,
    });
    if (!updatedOrder) return null;

    const nextStatus = newStatus ?? oldStatus;
    const totalChanged = newDeliveryCost !== undefined && updatedOrder.total !== oldOrder.total;
    if (oldStatus === 'delivered' && (nextStatus !== 'delivered' || totalChanged)) {
      await revertAnalyticsOnDelivery(oldOrder, session);
    }
    if (nextStatus === 'delivered' && (oldStatus !== 'delivered' || totalChanged)) {
      await updateAnalyticsOnDelivery(updatedOrder, session);
    }
    if (newStatus && oldStatus !== 'cancelled' && newStatus === 'cancelled') {
      await restoreStock(oldOrder.items, session);
    }

    return updatedOrder;
  });
};

export const softDelete = async (id: string): Promise<iOrder | null> => {
  return mongoose.connection.transaction(async session => {
    const order = await OrderModel.findById(id).session(session);
    if (!order || order.deleted) return order;

    if (order.status === 'delivered') {
      await revertAnalyticsOnDelivery(order, session);
    }
    if (order.status !== 'cancelled') {
      await restoreStock(order.items, session);
    }

    order.deleted = true;
    return order.save({ session });
  });
};
