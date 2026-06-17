import { Router } from "express";
import * as ProductController from './products.controller'
import { isAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router()

router.get('/', ProductController.getActiveProducts)

router.get('/admin', isAdmin, ProductController.getProducts)
router.post('/admin', isAdmin, validate(createProductSchema), ProductController.createNewProduct)
router.put('/admin/:id', isAdmin, validate(updateProductSchema), ProductController.updateProduct)
router.put('/admin/toggleActive/:id', isAdmin, ProductController.activeStatusProduct)
router.delete('/admin/:id', isAdmin, ProductController.deleteProduct)

export default router
