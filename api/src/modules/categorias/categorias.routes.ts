import { Router } from 'express'
import * as CategoriaController from './categorias.controller'
import { staffAccess } from '../../middlewares/auth.middleware'
import { resolvePublicBranch } from '../../middlewares/branch.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createCategoriaSchema, updateCategoriaSchema } from './categorias.schema'

const router = Router()

router.get('/', resolvePublicBranch, CategoriaController.getActiveCategorias)

router.get('/admin', staffAccess, CategoriaController.getCategorias)
router.post('/admin', staffAccess, validate(createCategoriaSchema), CategoriaController.createCategoria)
router.put('/admin/:id', staffAccess, validate(updateCategoriaSchema), CategoriaController.updateCategoria)
router.put('/admin/toggleActive/:id', staffAccess, CategoriaController.toggleActiveCategoria)
router.delete('/admin/:id', staffAccess, CategoriaController.deleteCategoria)

export default router
