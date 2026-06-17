import { Request, Response } from 'express'
import * as CategoriaService from './categorias.service'
import { sendError, sendSucces } from '../../utils/response'

export const getCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await CategoriaService.viewAll()
    return sendSucces(res, categorias)
  } catch (error) {
    return sendError(res, 'Error al obtener las categorías', 500)
  }
}

export const getActiveCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await CategoriaService.viewActive()
    return sendSucces(res, categorias)
  } catch (error) {
    return sendError(res, 'Error al obtener las categorías', 500)
  }
}

export const createCategoria = async (req: Request, res: Response) => {
  try {
    const categoria = await CategoriaService.create(req.body)
    return sendSucces(res, categoria, 201)
  } catch (error: any) {
    if (error?.code === 11000) return sendError(res, 'Ya existe una categoría con ese nombre', 409)
    return sendError(res, 'Error al crear la categoría', 500)
  }
}

export const updateCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const categoria = await CategoriaService.modify(id as string, req.body)
    if (!categoria) return sendError(res, 'Categoría no encontrada', 404)
    return sendSucces(res, categoria)
  } catch (error: any) {
    if (error?.code === 11000) return sendError(res, 'Ya existe una categoría con ese nombre', 409)
    return sendError(res, 'Error al actualizar la categoría', 500)
  }
}

export const toggleActiveCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const categoria = await CategoriaService.toggleActive(id as string)
    if (!categoria) return sendError(res, 'Categoría no encontrada', 404)
    return sendSucces(res, categoria)
  } catch (error) {
    return sendError(res, 'Error al activar / desactivar categoría', 500)
  }
}

export const deleteCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await CategoriaService.deleteById(id as string)
    if (!result) return sendError(res, 'Categoría no encontrada', 404)
    return sendSucces(res, result)
  } catch (error) {
    return sendError(res, 'Error al eliminar la categoría', 500)
  }
}
