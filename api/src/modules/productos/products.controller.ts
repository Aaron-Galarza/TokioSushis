import { Request, Response } from 'express'
import * as ProductService from './products.service'
import * as CategoriaService from '../categorias/categorias.service'
import { sendError, sendSucces } from '../../utils/response'

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductService.viewAll()
    return sendSucces(res, products)
  } catch (error) {
    return sendError(res, 'Error al obtener los productos', 500)
  }
}

export const getActiveProducts = async (req: Request, res: Response) => {
  try {
    const productos = await ProductService.viewActive()
    return sendSucces(res, productos)
  } catch (error) {
    return sendError(res, 'Error al obtener los productos', 500)
  }
}

export const createNewProduct = async (req: Request, res: Response) => {
  try {
    const { category } = req.body

    const categoriaValida = await CategoriaService.findById(category)
    if (!categoriaValida) return sendError(res, 'Categoría no encontrada', 404)
    if (!categoriaValida.active) return sendError(res, 'La categoría está inactiva', 400)

    const newProduct = await ProductService.create(req.body)
    return sendSucces(res, newProduct, 201)
  } catch (error) {
    return sendError(res, 'Error al cargar el producto', 500)
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }

    if (req.body.category) {
      const categoriaValida = await CategoriaService.findById(req.body.category)
      if (!categoriaValida) return sendError(res, 'Categoría no encontrada', 404)
      if (!categoriaValida.active) return sendError(res, 'La categoría está inactiva', 400)
    }

    const update = await ProductService.modify(id, req.body)
    if (!update) return sendError(res, 'Producto no encontrado', 404)

    return sendSucces(res, update, 200)
  } catch (error) {
    return sendError(res, 'Error al actualizar el producto', 500)
  }
}

export const activeStatusProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const product = await ProductService.toggleActive(id)
    if (!product) return sendError(res, 'Producto no encontrado', 404)
    return sendSucces(res, product, 200)
  } catch (error) {
    return sendError(res, 'Error al activar / desactivar producto', 500)
  }
}

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const result = await ProductService.deleteById(id)
    if (!result) return sendError(res, 'Producto no encontrado', 404)
    return sendSucces(res, result)
  } catch (error) {
    return sendError(res, 'Error al borrar producto', 500)
  }
}