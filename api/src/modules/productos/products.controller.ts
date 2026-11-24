import { Request, Response } from 'express'
import * as ProductService from './products.service'
import * as CategoriaService from '../categorias/categorias.service'
import { sendError, sendSucces } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'
import { OptionGroupModel } from '../option-groups/optionGroups.model'
import { ProductModel } from './products.model'

async function validateGroups(body: Record<string, unknown>, existingId?: string): Promise<string | null> {
  const existing = existingId ? await ProductModel.findById(existingId) : null
  const tipo = body.tipoProducto ?? existing?.tipoProducto ?? 'simple'
  const associations = (body.gruposOpciones ?? existing?.gruposOpciones ?? []) as Array<{ grupo: string; obligatorio?: boolean | null; minimo?: number | null; maximo?: number | null; ingredientes?: string[] }>
  if (tipo === 'simple') return associations.length ? 'Un producto simple no puede tener pasos' : null
  if (!associations.length) return 'Elegí al menos un grupo para el producto configurable'
  const ids = associations.map(item => String(item.grupo))
  if (new Set(ids).size !== ids.length) return 'No se puede repetir un grupo'
  const groups = await OptionGroupModel.find({ _id: { $in: ids } })
  if (groups.length !== ids.length || groups.some(group => !group.activo)) return 'Uno o más grupos no existen o están inactivos'
  for (const item of associations) {
    const group = groups.find(candidate => String(candidate._id) === String(item.grupo))!
    const min = item.minimo ?? group.minimo
    const max = item.maximo ?? group.maximo
    const required = item.obligatorio ?? group.obligatorio
    if (min > max || (required && min < 1) || (group.tipo === 'unico' && max !== 1)) return `Reglas inválidas en "${group.nombre}"`
    const allowed = new Set(group.ingredientes.map(entry => String(entry.ingrediente)))
    if (item.ingredientes?.some(id => !allowed.has(String(id)))) return `Ingrediente ajeno a "${group.nombre}"`
    if (item.ingredientes?.length && new Set(item.ingredientes.map(String)).size !== item.ingredientes.length) return `Ingrediente repetido en "${group.nombre}"`
    if (min > (item.ingredientes?.length || group.ingredientes.length)) return `Mínimo imposible en "${group.nombre}"`
  }
  return null
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductService.viewAll()
  return sendSucces(res, products)
})

export const getActiveProducts = asyncHandler(async (req: Request, res: Response) => {
  const productos = await ProductService.viewActive()
  return sendSucces(res, productos)
})

export const getDetailedProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.viewDetailed(req.params.id as string)
  if (!product || !product.active) return sendError(res, 'Producto no encontrado', 404)
  const { gruposOpciones: _internalGroups, ...publicProduct } = product
  return sendSucces(res, publicProduct)
})

export const createNewProduct = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.body

  const categoriaValida = await CategoriaService.findById(category)
  if (!categoriaValida) return sendError(res, 'Categoría no encontrada', 404)
  if (!categoriaValida.active) return sendError(res, 'La categoría está inactiva', 400)

  const groupError = await validateGroups(req.body)
  if (groupError) return sendError(res, groupError, 400)

  const newProduct = await ProductService.create(req.body)
  return sendSucces(res, newProduct, 201)
})

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  if (req.body.category) {
    const categoriaValida = await CategoriaService.findById(req.body.category)
    if (!categoriaValida) return sendError(res, 'Categoría no encontrada', 404)
    if (!categoriaValida.active) return sendError(res, 'La categoría está inactiva', 400)
  }

  const groupError = await validateGroups(req.body, id)
  if (groupError) return sendError(res, groupError, 400)

  const update = await ProductService.modify(id, req.body)
  if (!update) return sendError(res, 'Producto no encontrado', 404)

  return sendSucces(res, update, 200)
})

export const activeStatusProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const product = await ProductService.toggleActive(id)
  if (!product) return sendError(res, 'Producto no encontrado', 404)
  return sendSucces(res, product, 200)
})

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const result = await ProductService.deleteById(id)
  if (!result) return sendError(res, 'Producto no encontrado', 404)
  return sendSucces(res, result)
})
