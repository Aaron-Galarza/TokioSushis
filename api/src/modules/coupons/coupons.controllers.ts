import { Request, Response } from 'express'
import { sendError, sendSucces } from '../../utils/response'
import * as CouponsService from './coupons.services'

const dayMap: Record<string, string> = {
  domingo: 'sunday',
  lunes: 'monday',
  martes: 'tuesday',
  miercoles: 'wednesday',
  jueves: 'thursday',
  viernes: 'friday',
  sabado: 'saturday',
}

const getCurrentDay = () => {
  const day = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
  }).format(new Date())

  const normalized = day.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return dayMap[normalized] ?? normalized
}

export const getAllCoupons = async (_req: Request, res: Response) => {
  try {
    const coupons = await CouponsService.viewAll()
    return sendSucces(res, coupons, 200)
  } catch (error) {
    return sendError(res, 'Error al cargar los cupones', 500)
  }
}

export const createNewCoupon = async (req: Request, res: Response) => {
  try {
    const newCoupon = await CouponsService.create(req.body)
    return sendSucces(res, newCoupon, 201)
  } catch (error: any) {
    if (error?.code === 11000) return sendError(res, 'Ya existe un cupón con ese código', 409)
    return sendError(res, 'Error al crear el cupon', 500)
  }
}

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params
    const paymentMethod = req.body?.paymentMethod
    const result = await CouponsService.search(code as string)
    if (!result) return sendError(res, 'Cupon no valido, inexistente o expirado', 400)

    if (result.validPaymentMethods?.length && !result.validPaymentMethods.includes(paymentMethod)) {
      return sendError(res, 'Cupon no valido para este metodo de pago', 400)
    }

    if (result.validDays?.length && !result.validDays.includes(getCurrentDay())) {
      return sendError(res, 'Cupon no valido para el dia de hoy', 400)
    }

    return sendSucces(res, result)
  } catch (error) {
    return sendError(res, 'Error al validar cupon', 500)
  }
}

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await CouponsService.modify(id as string, req.body)
    if (!result) return sendError(res, 'Cupon no encontrado', 404)
    return sendSucces(res, result, 200)
  } catch (error) {
    return sendError(res, 'Error al actualizar cupon', 500)
  }
}

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await CouponsService.deleteById(id as string)
    if (!result) return sendError(res, 'Cupon no encontrado', 404)
    return sendSucces(res, result, 200)
  } catch (error) {
    return sendError(res, 'Error al borrar cupon', 500)
  }
}
