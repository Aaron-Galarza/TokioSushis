import { Request, Response } from 'express'
import { sendError, sendSucces } from '../../utils/response'
import * as CouponsService from './coupons.services'
import { asyncHandler } from '../../utils/asyncHandler'

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

export const getAllCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await CouponsService.viewAll()
  return sendSucces(res, coupons, 200)
})

export const createNewCoupon = asyncHandler(async (req: Request, res: Response) => {
  const newCoupon = await CouponsService.create(req.body)
  return sendSucces(res, newCoupon, 201)
})

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
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
})

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await CouponsService.modify(id as string, req.body)
  if (!result) return sendError(res, 'Cupon no encontrado', 404)
  return sendSucces(res, result, 200)
})

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await CouponsService.deleteById(id as string)
  if (!result) return sendError(res, 'Cupon no encontrado', 404)
  return sendSucces(res, result, 200)
})
