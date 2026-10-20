import { iOrder, iCartItem, iCartAddon, OrderModel, OrderStatus } from './orders.model'
import * as CouponService from '../coupons/coupons.services'
import * as ProductService from '../productos/products.service'
import * as AdicionalService from '../adicionales/adicionales.service'
import { checkStoreStatus } from '../Schedules/Schedule.service'
import { calculateDelivery } from '../delivery/delivery.service'
import { AppError } from '../../utils/AppError'
import { Range } from '../../utils/dateRange'
import { localDate, nextDay, rangeStart, startOfLocalDayUtc } from '../../utils/branchTime'
import { priceConfigurableItem, ConfiguratorError } from '../../utils/configuratorPricing'
import mongoose from 'mongoose'
import { createHash } from 'node:crypto'
import { ProductModel } from '../productos/products.model'
import { BranchModel } from '../branches/branch.model'
import { AdicionalModel } from '../adicionales/adicionales.model'
import { CouponModel } from '../coupons/coupons.model'
import { CategoriaModel } from '../categorias/categorias.model'

// Recargo del 15% por pago con tarjeta de crédito, sobre la base neta (subtotal - descuentos + envío)
const applyCreditSurcharge = (baseTotal: number, paymentMethod: string): { total: number; surcharge: number } => {
  const surcharge = paymentMethod === 'credito' ? Math.round(baseTotal * 0.15) : 0
  return { total: baseTotal + surcharge, surcharge }
}

export const createOrder = async (branchId: string, orderData: any, idempotencyKey: string): Promise<{ order: iOrder; created: boolean }> => {
  const requestHash = createHash('sha256').update(JSON.stringify(orderData)).digest('hex')
  const existing = await OrderModel.findOne({ branchId, idempotencyKey })
  if (existing) {
    if (existing.requestHash !== requestHash) throw new AppError(409, 'La clave del pedido ya se usó con otros datos')
    return { order: existing, created: false }
  }
 
  const storeStatus = await checkStoreStatus(branchId)
  if (!storeStatus.isOpen) {
    // 423 (Locked) y no 403: el 403 está reservado por el middleware de auth para token inválido/expirado,
    // y el interceptor del front desloguea ante cualquier 403. "Local cerrado" es una regla de negocio, no un tema de sesión.
    throw new AppError(423, storeStatus.message || 'El negocio está cerrado en este momento')
  }
  const branch = await BranchModel.findById(branchId).select('paymentMethods timezone').lean()
  if (!branch || !branch.paymentMethods.includes(orderData.paymentMethod)) {
    throw new AppError(400, 'Este método de pago no está disponible en la sucursal')
  }
 
  const productVersions: number[] = []
  const items: iCartItem[] = await Promise.all(
    orderData.items.map(async (item: any, index: number) => {
 
      const product = await ProductService.viewById(branchId, item.productId)
      if (!product) throw new AppError(404, `Producto ${item.productId} no encontrado`)
 
      if (!product.active) throw new AppError(400, `El producto "${product.title}" no está disponible`)
      if (!await CategoriaModel.exists({ _id: product.category, branchId, active: true })) {
        throw new AppError(400, `La categoría de "${product.title}" no está disponible`)
      }
      productVersions[index] = (product.get('updatedAt') as Date | undefined)?.getTime() ?? 0
      if (product.controlStock) {
        if (product.stock <= 0) {
          throw new AppError(400, `El producto "${product.title}" se encuentra agotado`)
        }
        if (item.quantity > product.stock) {
          throw new AppError(400, `Stock insuficiente para "${product.title}". Disponibles: ${product.stock}, solicitados: ${item.quantity}`)
        }
        
      }

      let addons: iCartAddon[] = []
      if (item.addons && item.addons.length > 0) {
        addons = await Promise.all(
          item.addons.map(async (a: any) => {
            const adicional = await AdicionalService.viewById(branchId, a.addonId)
            if (!adicional) throw new AppError(404, `Adicional ${a.addonId} no encontrado`)
            if (!adicional.active) throw new AppError(400, `El adicional "${adicional.title}" no está disponible`)
            if (adicional.categories?.length && !adicional.categories.some(
              (categoryId) => categoryId.toString() === product.category.toString())) {
              throw new AppError(400, `El adicional "${adicional.title}" no corresponde a este producto`)
            }
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
 
      // Producto configurable: validar selecciones y recalcular precio en el server
      let price = product.price
      let configSummary: string | undefined
      let selections: iCartItem['selections']

      if (product.configurator && product.configurator.enabled) {
        try {
          const priced = priceConfigurableItem(product.price, product.configurator, item.selections)
          price = priced.finalPrice
          configSummary = priced.summary
          selections = priced.selections.map((s) => ({
            stepId: s.stepId,
            stepLabel: s.stepLabel,
            optionId: s.optionId,
            label: s.label,
            price: s.price,
            kind: s.kind,
          }))
        } catch (e) {
          if (e instanceof ConfiguratorError) {
            throw new AppError(400, `${product.title}: ${e.message}`)
          }
          throw e
        }
      }

      return {
        productId: item.productId,
        title:     product.title,
        price,
        quantity:  item.quantity,
        addons,
        configSummary,
        selections,
      };
    })
  )

  const subTotal = items.reduce((acc, item) => {
    const addonsTotal = (item.addons || []).reduce((a, addon) => a + addon.price * addon.quantity, 0)
    return acc + item.quantity * (item.price + addonsTotal)
  }, 0)
 
  let total = subTotal
  let discountPercent = 0
  if (orderData.couponCode) {
    const coupon = await CouponService.search(branchId, orderData.couponCode)
    if (!coupon) throw new AppError(404, 'El cupón ingresado no es válido o ya no existe')
    
    const couponError = CouponService.validateCoupon(coupon, orderData.paymentMethod, orderData.deliveryType, branch.timezone);
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

    if (!hasCoordinates) throw new AppError(400, 'Faltan coordenadas para calcular el envío')
    const deliveryCalculation = await calculateDelivery(branchId, coordinates.lat, coordinates.lng)
    deliveryCost = deliveryCalculation.deliveryCost
    delivery.distanceKm = deliveryCalculation.distanceKm
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
    branchId,
    idempotencyKey,
    requestHash,
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
 
  let saved: iOrder
  try {
    saved = await mongoose.connection.transaction(async (session) => {
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        const product = await ProductModel.findOne({ _id: item.productId, branchId, active: true,
          deleted: { $ne: true } }).session(session)
        if (!product || ((product.get('updatedAt') as Date | undefined)?.getTime() ?? 0) !== productVersions[index]) {
          throw new AppError(409, 'El menú cambió. Revisá el pedido antes de enviarlo')
        }
        if (!await CategoriaModel.exists({ _id: product.category, branchId, active: true }).session(session)) {
          throw new AppError(409, 'La categoría ya no está disponible')
        }
        for (const addon of item.addons ?? []) {
          const current = await AdicionalModel.findOne({ _id: addon.addonId, branchId, active: true }).session(session)
          if (!current || current.price !== addon.price || (current.categories?.length
            && !current.categories.some((categoryId) => categoryId.toString() === product.category.toString()))) {
            throw new AppError(409, 'Un adicional cambió. Revisá el pedido antes de enviarlo')
          }
        }
      }
      if (orderData.couponCode) {
        const coupon = await CouponModel.findOne({ branchId, code: orderData.couponCode.toUpperCase(),
          active: { $ne: false } }).session(session)
        if (!coupon || coupon.discountPercent !== discountPercent
          || CouponService.validateCoupon(coupon, orderData.paymentMethod, orderData.deliveryType, branch.timezone)) {
          throw new AppError(409, 'El cupón cambió. Revisá el pedido antes de enviarlo')
        }
      }
      const quantities = new Map<string, number>()
      for (const item of items) {
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
      }
      for (const [productId, quantity] of quantities) {
        const product = await ProductModel.findOne({ _id: productId, branchId, active: true,
          deleted: { $ne: true } }).session(session)
        if (!product) throw new AppError(400, 'Un producto ya no está disponible')
        if (product.controlStock) {
          const updated = await ProductModel.updateOne(
            { _id: productId, branchId, active: true, deleted: { $ne: true }, controlStock: true, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { session },
          )
          if (updated.modifiedCount !== 1) throw new AppError(409, `Stock insuficiente para "${product.title}"`)
        }
      }
      await newOrder.save({ session })
      return newOrder
    })
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicate = await OrderModel.findOne({ branchId, idempotencyKey })
      if (duplicate) {
        if (duplicate.requestHash !== requestHash) throw new AppError(409, 'La clave del pedido ya se usó con otros datos')
        return { order: duplicate, created: false }
      }
    }
    throw error
  }
  console.log(`[PEDIDO] Nuevo pedido ${saved._id} - ${saved.customer.name} - $${saved.total}`)
  return { order: saved, created: true }
}

export const getAllOrders = async (branchId: string): Promise<iOrder[]> => {
  return await OrderModel.find({ branchId, deleted: { $ne: true } }).sort({ createdAt: -1 })
}

export const getOrdersRange = async (branchId: string, range: Range): Promise<iOrder[]> => {
  const branch = await BranchModel.findById(branchId).select('timezone').lean();
  if (!branch) throw new AppError(404, 'Sucursal no encontrada');
  const today = localDate(branch.timezone);
  const first = rangeStart(today, range);
  const lastExclusive = range === 'ayer' ? today : nextDay(today);
  return await OrderModel.find({ branchId, deleted: { $ne: true }, createdAt: {
    $gte: startOfLocalDayUtc(first, branch.timezone),
    $lt: startOfLocalDayUtc(lastExclusive, branch.timezone),
  } }).lean().sort({ createdAt: -1 });
}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'in-preparation',
  'in-preparation': 'ready',
  ready: 'delivered',
};

const restoreStock = async (order: iOrder, session: mongoose.ClientSession) => {
  const quantities = new Map<string, number>();
  for (const item of order.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  for (const [productId, quantity] of quantities) {
    await ProductModel.updateOne(
      { _id: productId, branchId: order.branchId, controlStock: true },
      { $inc: { stock: quantity } }, { session },
    );
  }
};

export const update = async (
  branchId: string,
  id: string,
  newStatus?: OrderStatus,
  newDeliveryCost?: number,
  role: 'admin' | 'encargado' = 'admin',
): Promise<iOrder | null> => mongoose.connection.transaction(async (session) => {
  const order = await OrderModel.findOne({ _id: id, branchId, deleted: { $ne: true } }).session(session);
  if (!order) return null;
  if (newStatus === undefined && newDeliveryCost === undefined) throw new AppError(400, 'No hay cambios para aplicar');

  if (newStatus && newStatus !== order.status) {
    const canAdvance = nextStatus[order.status] === newStatus;
    const canCancel = newStatus === 'cancelled' && order.status !== 'cancelled'
      && (role === 'encargado' || order.status !== 'delivered');
    if (!canAdvance && !canCancel) throw new AppError(409, 'Transición de estado no permitida');
    if (newStatus === 'cancelled') await restoreStock(order, session);
    order.status = newStatus;
  }

  if (newDeliveryCost !== undefined) {
    if (order.deliveryType !== 'delivery' || ['delivered', 'cancelled'].includes(order.status)) {
      throw new AppError(409, 'No se puede modificar el envío de este pedido');
    }
    const discount = (order.subtotal * order.discountPercent) / 100;
    const recalculated = applyCreditSurcharge(order.subtotal - discount + newDeliveryCost, order.paymentMethod);
    order.deliveryCost = newDeliveryCost;
    order.surcharge = recalculated.surcharge;
    order.total = Math.max(0, recalculated.total);
  }

  await order.save({ session });
  return order;
});

export const softDelete = async (branchId: string, id: string): Promise<iOrder | null> =>
  mongoose.connection.transaction(async (session) => {
    const order = await OrderModel.findOne({ _id: id, branchId }).session(session);
    if (!order) return null;
    if (order.deleted) return order;
    if (order.status !== 'cancelled') await restoreStock(order, session);
    order.deleted = true;
    await order.save({ session });
    return order;
  });
