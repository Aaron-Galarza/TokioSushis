import { Request, Response } from 'express'
import * as ProductService from './products.service'
import * as CategoriaService from '../categorias/categorias.service'
import { sendError, sendSucces } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'
import { requireBranchId } from '../../middlewares/branch.middleware'

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductService.viewAll(requireBranchId(req))
  return sendSucces(res, products)
})

export const getActiveProducts = asyncHandler(async (req: Request, res: Response) => {
  const productos = await ProductService.viewActive(requireBranchId(req))
  return sendSucces(res, productos)
})

export const createNewProduct = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.body

  const categoriaValida = await CategoriaService.findById(requireBranchId(req), category)
  if (!categoriaValida) return sendError(res, 'Categoría no encontrada', 404)
  if (!categoriaValida.active) return sendError(res, 'La categoría está inactiva', 400)

  const newProduct = await ProductService.create(requireBranchId(req), req.body)
  return sendSucces(res, newProduct, 201)
})

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  if (req.body.category) {
    const categoriaValida = await CategoriaService.findById(requireBranchId(req), req.body.category)
    if (!categoriaValida) return sendError(res, 'Categoría no encontrada', 404)
    if (!categoriaValida.active) return sendError(res, 'La categoría está inactiva', 400)
  }

  const update = await ProductService.modify(requireBranchId(req), id, req.body)
  if (!update) return sendError(res, 'Producto no encontrado', 404)

  return sendSucces(res, update, 200)
})

export const activeStatusProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const product = await ProductService.toggleActive(requireBranchId(req), id)
  if (!product) return sendError(res, 'Producto no encontrado', 404)
  return sendSucces(res, product, 200)
})

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const product = await ProductService.setStock(requireBranchId(req), id, req.body.stock)
  if (!product) return sendError(res, 'Producto no encontrado', 404)
  return sendSucces(res, product, 200)
})

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const result = await ProductService.deleteById(requireBranchId(req), id)
  if (!result) return sendError(res, 'Producto no encontrado', 404)
  return sendSucces(res, result)
})
