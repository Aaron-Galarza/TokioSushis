import { Request, Response } from 'express'
import * as AdicionalService from './adicionales.service'
import * as CategoriaService from '../categorias/categorias.service'
import { sendError, sendSucces } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const getAdicionales = asyncHandler(async (req: Request, res: Response) => {
  const adicionales = await AdicionalService.viewAll()
  return sendSucces(res, adicionales)
})

export const getActiveAdicionales = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.query.category as string | undefined
  const adicionales = categoryId
    ? await AdicionalService.viewByCategory(categoryId)
    : await AdicionalService.viewActive()
  return sendSucces(res, adicionales)
})

export const createAdicional = asyncHandler(async (req: Request, res: Response) => {
  const categories: string[] = req.body.categories ?? []
  for (const id of categories) {
    const cat = await CategoriaService.findById(id)
    if (!cat) return sendError(res, `Categoría no encontrada: ${id}`, 404)
    if (!cat.active) return sendError(res, `La categoría está inactiva: ${cat.name}`, 400)
  }
  const adicional = await AdicionalService.create(req.body)
  return sendSucces(res, adicional, 201)
})

export const updateAdicional = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const categories: string[] = req.body.categories ?? []
  for (const catId of categories) {
    const cat = await CategoriaService.findById(catId)
    if (!cat) return sendError(res, `Categoría no encontrada: ${catId}`, 404)
    if (!cat.active) return sendError(res, `La categoría está inactiva: ${cat.name}`, 400)
  }
  const adicional = await AdicionalService.modify(id, req.body)
  if (!adicional) return sendError(res, 'Adicional no encontrado', 404)
  return sendSucces(res, adicional)
})

export const toggleActiveAdicional = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const adicional = await AdicionalService.toggleActive(id)
  if (!adicional) return sendError(res, 'Adicional no encontrado', 404)
  return sendSucces(res, adicional)
})

export const deleteAdicional = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await AdicionalService.deleteById(id)
  if (!result) return sendError(res, 'Adicional no encontrado', 404)
  return sendSucces(res, result)
})
