import { Request, Response } from 'express'
import * as OrderService from './orders.service'
import { sendError, sendSucces } from '../../utils/response'
import { validOrderStatus, OrderStatus } from './orders.model'
import { getIO } from '../../socket/socket'
import { AppError, friendlyAppErrorMessage } from '../../utils/AppError'
import { Range } from '../../utils/dateRange'
import { asyncHandler } from '../../utils/asyncHandler'

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.createOrder(req.body)
    getIO().to('admins').emit('new-order', order)
    return sendSucces(res, order, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(res, friendlyAppErrorMessage(error), error.statusCode)
    }
    const esErrorDeNegocio = error?.message && !error.message.includes('Cannot')
    if (esErrorDeNegocio) return sendError(res, error.message, 400)
    console.error(`[ERROR] createOrder - ${error?.message}`)
    return sendError(res, 'Error al procesar el pedido', 500)
  }
}

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await OrderService.getAllOrders()
  return sendSucces(res, orders, 200)
})

export const getOrdersRange = asyncHandler(async (req: Request, res: Response) => {
  const rango = (req.query.range as string) || 'hoy';
  const orders = await OrderService.getOrdersRange(rango as Range)
  return sendSucces(res, orders, 200)
})

export const updateStatusOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const { status, deliveryCost } = req.body

  // Validar status si viene
  if (status !== undefined && !validOrderStatus.includes(status as OrderStatus)) {
    return sendError(res, 'Estado no valido para la orden')
  }

  // Validar deliveryCost si viene
  if (deliveryCost !== undefined && (typeof deliveryCost !== 'number' || deliveryCost < 0)) {
    return sendError(res, 'Costo de envío inválido', 400)
  }

  const order = await OrderService.update(id, status, deliveryCost)
  if (!order) return sendError(res, 'Pedido no encontrado', 404)

  if (status) getIO().to('admins').emit('order-updated', { id, status })
  return sendSucces(res, order, 200)
})