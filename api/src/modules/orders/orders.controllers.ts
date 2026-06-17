import { Request, Response } from 'express'
import * as OrderService from './orders.service'
import { sendError, sendSucces } from '../../utils/response'
import { validOrderStatus, OrderStatus } from './orders.model'
import { getIO } from '../../socket/socket'
import { AppError } from '../../utils/AppError'

const VALID_RANGES = ['hoy', 'ayer', 'semana', 'mes'] as const;
type Range = (typeof VALID_RANGES)[number];

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.createOrder(req.body)
    getIO().to('admins').emit('new-order', order)
    return sendSucces(res, order, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      const message = error.statusCode === 503 ? 'No pudimos calcular el envio en este momento' : error.message
      return sendError(res, message, error.statusCode)
    }

    const esErrorDeNegocio = error?.message && !error.message.includes('Cannot')
    if (esErrorDeNegocio) return sendError(res, error.message, 400)
    console.error(`[ERROR] createOrder - ${error?.message}`)
    return sendError(res, 'Error al procesar el pedido', 500)
  }
}

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await OrderService.getAllOrders()
    return sendSucces(res, orders, 200)
  } catch (error: any) {
    console.error(`[ERROR] getOrders - ${error?.message}`)
    return sendError(res, 'Error al obtener pedidos', 500)
  }
}

export const getOrdersRange = async (req: Request, res: Response) => {
  try {
    const rango = (req.query.range as string) || 'hoy';
    const orders = await OrderService.getOrdersRange(rango as Range)
    return sendSucces(res, orders, 200)
  } catch (error) {
    return sendError(res, 'Error al obtener pedidos en rango')
  }
}

export const updateStatusOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!validOrderStatus.includes(status as OrderStatus)) {
      return sendError(res, 'Estado no valido para la orden')
    }

    const order = await OrderService.update(id as string, status)

    if (!order) return sendError(res, 'Pedido no encontrado', 404)

    getIO().to('admins').emit('order-updated', { id, status })
    return sendSucces(res, order, 200)
  } catch (error: any) {
    console.error(`[ERROR] updateStatusOrder - ${error?.message}`)
    return sendError(res, 'Error al actualizar el estado de la orden', 500)
  }
}
