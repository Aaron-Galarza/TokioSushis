import { Router } from 'express';
import { getAllCoupons, createNewCoupon, validateCoupon, deleteCoupon, updateCoupon } from './coupons.controllers';
import { managerAccess } from '../../middlewares/auth.middleware';
import { resolvePublicBranch } from '../../middlewares/branch.middleware';
import { couponLimiter } from '../../middlewares/rateLimiter.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCouponSchema, updateCouponSchema } from './coupons.schema';

const router = Router()

router.post('/validate/:code', couponLimiter, resolvePublicBranch, validateCoupon)

router.get('/admin', managerAccess, getAllCoupons)
router.post('/admin', managerAccess, validate(createCouponSchema), createNewCoupon)
router.put('/admin/:id', managerAccess, validate(updateCouponSchema), updateCoupon)
router.delete('/admin/:id', managerAccess, deleteCoupon)

export default router
