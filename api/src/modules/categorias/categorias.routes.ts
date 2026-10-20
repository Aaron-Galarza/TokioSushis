import { Router } from 'express'
import * as CategoriaController from './categorias.controller'
import { staffAccess, managerAccess } from '../../middlewares/auth.middleware'
import { resolvePublicBranch } from '../../middlewares/branch.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createCategoriaSchema, updateCategoriaSchema } from './categorias.schema'

const router = Router()

router.get('/', resolvePublicBranch, CategoriaController.getActiveCategorias)

router.get('/admin', staffAccess, CategoriaController.getCategorias)
router.post('/admin', managerAccess, validate(createCategoriaSchema), CategoriaController.createCategoria)
router.put('/admin/:id', managerAccess, validate(updateCategoriaSchema), CategoriaController.updateCategoria)
router.put('/admin/toggleActive/:id', managerAccess, CategoriaController.toggleActiveCategoria)
router.delete('/admin/:id', managerAccess, CategoriaController.deleteCategoria)

export default router
