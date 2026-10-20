import { Request, Response } from 'express'
import * as OrderService from './orders.service'
import { sendError, sendSucces } from '../../utils/response'
import { validOrderStatus, OrderStatus } from './orders.model'
import { getIO } from '../../socket/socket'
import { AppError, friendlyAppErrorMessage } from '../../utils/AppError'
import { Range, VALID_RANGES } from '../../utils/dateRange'
import { asyncHandler } from '../../utils/asyncHandler'
import { requireBranchId } from '../../middlewares/branch.middleware'

export const createOrder = async (req: Request, res: Response) => {
  try {
    const branchId = requireBranchId(req)
    const idempotencyKey = req.get('idempotency-key') ?? ''
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) {
      return sendError(res, 'Clave de pedido inválida o faltante', 400)
    }
    const { order, created } = await OrderService.createOrder(branchId, req.body, idempotencyKey)
    if (created) {
      try {
        getIO().to(`branch:${branchId}`).emit('new-order', order)
      } catch (socketError) {
        console.error('[SOCKET] Pedido guardado pero no se pudo notificar', socketError)
      }
    }
    return sendSucces(res, order, created ? 201 : 200)
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
  const orders = await OrderService.getAllOrders(requireBranchId(req))
  return sendSucces(res, orders, 200)
})

export const getOrdersRange = asyncHandler(async (req: Request, res: Response) => {
  const rango = (req.query.range as string) || 'hoy';
  if (!VALID_RANGES.includes(rango as Range)) return sendError(res, 'Rango inválido', 400)
  const orders = await OrderService.getOrdersRange(requireBranchId(req), rango as Range)
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

  const branchId = requireBranchId(req)
  const order = await OrderService.update(branchId, id, status, deliveryCost, req.auth?.role === 'encargado' ? 'encargado' : 'admin')
  if (!order) return sendError(res, 'Pedido no encontrado', 404)

  if (status) getIO().to(`branch:${branchId}`).emit('order-updated', { id, status })
  return sendSucces(res, order, 200)
})

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string

  const branchId = requireBranchId(req)
  const order = await OrderService.softDelete(branchId, id)
  if (!order) return sendError(res, 'Pedido no encontrado', 404)

  getIO().to(`branch:${branchId}`).emit('order-deleted', { id: order._id })
  return sendSucces(res, order, 200)
})
