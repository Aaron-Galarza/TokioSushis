import { iOrder, iCartItem, iCartAddon, OrderModel, OrderStatus } from './orders.model'
import * as CouponService from '../coupons/coupons.services'
import * as ProductService from '../productos/products.service'
import * as AdicionalService from '../adicionales/adicionales.service'
import { updateAnalyticsOnDelivery, revertAnalyticsOnDelivery } from '../analytics/analytics.service'
import { checkStoreStatus } from '../Schedules/Schedule.service'
import { calculateDelivery } from '../delivery/delivery.service'
import { AppError } from '../../utils/AppError'
import { argDate, argToUTC } from '../../utils/Timezone'

export const createOrder = async (orderData: any): Promise<iOrder> => {
 
  const storeStatus = await checkStoreStatus()
  if (!storeStatus.isOpen) {
    throw new AppError(403, storeStatus.message || 'El negocio está cerrado en este momento')
  }
 
  const items: iCartItem[] = await Promise.all(
    orderData.items.map(async (item: any) => {
 
      const product = await ProductService.viewById(item.productId)
      if (!product) throw new AppError(404, `Producto ${item.productId} no encontrado`)
 
      // 🔥 FIX CRÍTICO DE STOCK: Validación real en el servidor
      if (product.controlStock) {
        if (product.stock <= 0) {
          throw new AppError(400, `El producto "${product.title}" se encuentra agotado`)
        }
        if (item.quantity > product.stock) {
          throw new AppError(400, `Stock insuficiente para "${product.title}". Disponibles: ${product.stock}, solicitados: ${item.quantity}`)
        }
        
        // Descontamos el stock de forma exacta
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
    
    // 🔥 CRUCES DE REGLAS DE NEGOCIO REALES EN BACKEND
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

export const getOrdersRange = async (range: 'hoy' | 'ayer' | 'semana' | 'mes'): Promise<iOrder[]> => {
  const today = argDate();                  
  let start: Date;
  let end: Date | null = null;
 
  switch (range) {
    case 'hoy':
      start = argToUTC(today);               
      break;
 
    case 'ayer': {
      const d = new Date(today + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      const ayer = d.toISOString().slice(0, 10);
      start = argToUTC(ayer);                
      end   = argToUTC(today);               
      break;
    }
 
    case 'semana': {
      const d = new Date(today + 'T12:00:00Z');
      const dow = d.getUTCDay();             
      d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
      start = argToUTC(d.toISOString().slice(0, 10));
      break;
    }
 
    case 'mes':
      start = argToUTC(today.slice(0, 8) + '01'); 
      break;
  }
 
  const filter: any = { $gte: start };
  if (end) filter.$lt = end;
 
  return await OrderModel.find({ createdAt: filter }).lean().sort({ createdAt: -1 });
}

export const update = async (
  id: string,
  newStatus: OrderStatus
): Promise<iOrder | null> => {
  const oldOrder = await OrderModel.findById(id);
  if (!oldOrder) return null;
 
  const oldStatus = oldOrder.status;
 
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    id,
    { status: newStatus },
    { returnDocument: 'after' }
  );
 
  if (!updatedOrder) return null;
 
  console.log(`[PEDIDO] Pedido ${updatedOrder._id} actualizado de "${oldStatus}" a "${newStatus}"`);
 
  // 📈 Pedido se entrega ahora → sumar a analytics
  if (oldStatus !== 'delivered' && newStatus === 'delivered') {
    await updateAnalyticsOnDelivery(updatedOrder);
  }
 
  // 📉 Pedido estaba entregado y se revierte o cancela → restar de analytics
  if (oldStatus === 'delivered' && newStatus !== 'delivered') {
    await revertAnalyticsOnDelivery(updatedOrder);
  }

  // 🔄 REVERSIÓN DE STOCK SI SE CANCELA EL PEDIDO
  // Evitamos devolver stock doble validando que el estado anterior no haya sido ya cancelado
  if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
    console.log(`[STOCK] Devolviendo stock por cancelacion del pedido ${updatedOrder._id}`);
    for (const item of oldOrder.items) {
      const product = await ProductService.viewById(item.productId);
      if (product && product.controlStock) {
        product.stock += item.quantity;
        await product.save();
        console.log(`   -> Repuesto "${product.title}": +${item.quantity} unidades (Nuevo Stock: ${product.stock})`);
      }
    }
  }
 
  return updatedOrder;
};