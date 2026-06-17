import { Router } from 'express'
import * as AdicionalController from './adicionales.controller'
import { isAdmin } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createAdicionalSchema, updateAdicionalSchema } from './adicionales.schema'

const router = Router()

router.get('/', AdicionalController.getActiveAdicionales)

router.get('/admin', isAdmin, AdicionalController.getAdicionales)
router.post('/admin', isAdmin, validate(createAdicionalSchema), AdicionalController.createAdicional)
router.put('/admin/:id', isAdmin, validate(updateAdicionalSchema), AdicionalController.updateAdicional)
router.put('/admin/toggleActive/:id', isAdmin, AdicionalController.toggleActiveAdicional)
router.delete('/admin/:id', isAdmin, AdicionalController.deleteAdicional)

export default router
