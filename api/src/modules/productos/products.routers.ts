import { Router } from "express";
import * as ProductController from './products.controller'
import { staffAccess } from '../../middlewares/auth.middleware';
import { resolvePublicBranch } from '../../middlewares/branch.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema, updateProductStockSchema } from './products.schema';

const router = Router()

router.get('/', resolvePublicBranch, ProductController.getActiveProducts)

router.get('/admin', staffAccess, ProductController.getProducts)
router.post('/admin', staffAccess, validate(createProductSchema), ProductController.createNewProduct)
router.put('/admin/:id', staffAccess, validate(updateProductSchema), ProductController.updateProduct)
router.put('/admin/toggleActive/:id', staffAccess, ProductController.activeStatusProduct)
router.patch('/admin/:id/stock', staffAccess, validate(updateProductStockSchema), ProductController.updateStock)
router.delete('/admin/:id', staffAccess, ProductController.deleteProduct)

export default router
