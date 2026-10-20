import { Request, Response } from 'express'
import { sendError, sendSucces } from '../../utils/response'
import * as CouponsService from './coupons.services'
import { asyncHandler } from '../../utils/asyncHandler'
import { requireBranchId } from '../../middlewares/branch.middleware'
import { BranchModel } from '../branches/branch.model'

export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await CouponsService.viewAll(requireBranchId(req))
  return sendSucces(res, coupons, 200)
})

export const createNewCoupon = asyncHandler(async (req: Request, res: Response) => {
  const newCoupon = await CouponsService.create(requireBranchId(req), req.body)
  return sendSucces(res, newCoupon, 201)
})

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params
  const paymentMethod = req.body?.paymentMethod
  const branchId = requireBranchId(req)
  const [result, branch] = await Promise.all([
    CouponsService.search(branchId, code as string),
    BranchModel.findById(branchId).select('timezone').lean(),
  ])
  if (!result) return sendError(res, 'Cupon no valido, inexistente o expirado', 400)
  if (!branch) return sendError(res, 'Sucursal no encontrada', 404)
  const error = CouponsService.validateCoupon(result, paymentMethod, req.body?.deliveryType, branch.timezone)
  if (error) return sendError(res, error, 400)

  return sendSucces(res, result)
})

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await CouponsService.modify(requireBranchId(req), id as string, req.body)
  if (!result) return sendError(res, 'Cupon no encontrado', 404)
  return sendSucces(res, result, 200)
})

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await CouponsService.deleteById(requireBranchId(req), id as string)
  if (!result) return sendError(res, 'Cupon no encontrado', 404)
  return sendSucces(res, result, 200)
})
