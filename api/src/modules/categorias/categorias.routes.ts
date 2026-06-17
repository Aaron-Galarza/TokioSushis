import { Router } from 'express'
import * as CategoriaController from './categorias.controller'
import { isAdmin } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createCategoriaSchema, updateCategoriaSchema } from './categorias.schema'

const router = Router()

router.get('/', CategoriaController.getActiveCategorias)

router.get('/admin', isAdmin, CategoriaController.getCategorias)
router.post('/admin', isAdmin, validate(createCategoriaSchema), CategoriaController.createCategoria)
router.put('/admin/:id', isAdmin, validate(updateCategoriaSchema), CategoriaController.updateCategoria)
router.put('/admin/toggleActive/:id', isAdmin, CategoriaController.toggleActiveCategoria)
router.delete('/admin/:id', isAdmin, CategoriaController.deleteCategoria)

export default router
