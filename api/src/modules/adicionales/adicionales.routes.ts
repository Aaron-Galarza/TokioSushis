import { Router } from 'express'
import * as AdicionalController from './adicionales.controller'
import { staffAccess, managerAccess } from '../../middlewares/auth.middleware'
import { resolvePublicBranch } from '../../middlewares/branch.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createAdicionalSchema, updateAdicionalSchema } from './adicionales.schema'

const router = Router()

router.get('/', resolvePublicBranch, AdicionalController.getActiveAdicionales)

router.get('/admin', staffAccess, AdicionalController.getAdicionales)
router.post('/admin', managerAccess, validate(createAdicionalSchema), AdicionalController.createAdicional)
router.put('/admin/:id', managerAccess, validate(updateAdicionalSchema), AdicionalController.updateAdicional)
router.put('/admin/toggleActive/:id', staffAccess, AdicionalController.toggleActiveAdicional)
router.delete('/admin/:id', managerAccess, AdicionalController.deleteAdicional)

export default router
