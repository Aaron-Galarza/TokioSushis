import { Request, Response } from 'express'
import * as AdicionalService from './adicionales.service'
import * as CategoriaService from '../categorias/categorias.service'
import { sendError, sendSucces } from '../../utils/response'

export const getAdicionales = async (req: Request, res: Response) => {
  try {
    const adicionales = await AdicionalService.viewAll()
    return sendSucces(res, adicionales)
  } catch (error) {
    return sendError(res, 'Error al obtener los adicionales', 500)
  }
}

export const getActiveAdicionales = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.category as string | undefined
    const adicionales = categoryId
      ? await AdicionalService.viewByCategory(categoryId)
      : await AdicionalService.viewActive()
    return sendSucces(res, adicionales)
  } catch (error) {
    return sendError(res, 'Error al obtener los adicionales', 500)
  }
}

export const createAdicional = async (req: Request, res: Response) => {
  try {
    const categories: string[] = req.body.categories ?? []
    for (const id of categories) {
      const cat = await CategoriaService.findById(id)
      if (!cat) return sendError(res, `Categoría no encontrada: ${id}`, 404)
      if (!cat.active) return sendError(res, `La categoría está inactiva: ${cat.name}`, 400)
    }
    const adicional = await AdicionalService.create(req.body)
    return sendSucces(res, adicional, 201)
  } catch (error) {
    return sendError(res, 'Error al crear el adicional', 500)
  }
}

export const updateAdicional = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    return sendError(res, 'Error al actualizar el adicional', 500)
  }
}

export const toggleActiveAdicional = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const adicional = await AdicionalService.toggleActive(id)
    if (!adicional) return sendError(res, 'Adicional no encontrado', 404)
    return sendSucces(res, adicional)
  } catch (error) {
    return sendError(res, 'Error al activar / desactivar adicional', 500)
  }
}

export const deleteAdicional = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const result = await AdicionalService.deleteById(id)
    if (!result) return sendError(res, 'Adicional no encontrado', 404)
    return sendSucces(res, result)
  } catch (error) {
    return sendError(res, 'Error al eliminar el adicional', 500)
  }
}