import { Request, Response } from 'express'
import * as CategoriaService from './categorias.service'
import { sendError, sendSucces } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'
import { requireBranchId } from '../../middlewares/branch.middleware'

export const getCategorias = asyncHandler(async (req: Request, res: Response) => {
  const categorias = await CategoriaService.viewAll(requireBranchId(req))
  return sendSucces(res, categorias)
})

export const getActiveCategorias = asyncHandler(async (req: Request, res: Response) => {
  const categorias = await CategoriaService.viewActive(requireBranchId(req))
  return sendSucces(res, categorias)
})

export const createCategoria = asyncHandler(async (req: Request, res: Response) => {
  const categoria = await CategoriaService.create(requireBranchId(req), req.body)
  return sendSucces(res, categoria, 201)
})

export const updateCategoria = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const categoria = await CategoriaService.modify(requireBranchId(req), id as string, req.body)
  if (!categoria) return sendError(res, 'Categoría no encontrada', 404)
  return sendSucces(res, categoria)
})

export const toggleActiveCategoria = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const categoria = await CategoriaService.toggleActive(requireBranchId(req), id as string)
  if (!categoria) return sendError(res, 'Categoría no encontrada', 404)
  return sendSucces(res, categoria)
})

export const deleteCategoria = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await CategoriaService.deleteById(requireBranchId(req), id as string)
  if (!result) return sendError(res, 'Categoría no encontrada', 404)
  return sendSucces(res, result)
})
