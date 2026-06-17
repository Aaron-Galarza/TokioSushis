import { Router } from 'express';
import productRoutes from '../modules/productos/products.routers';
import orderRoutes from '../modules/orders/orders.routes';
import couponsRoutes from '../modules/coupons/coupons.routes'
import userRouters from '../modules/users/user.routers'
import adicionalRoutes from '../modules/adicionales/adicionales.routes'
import categoriaRoutes from '../modules/categorias/categorias.routes'
import configRoutes from '../modules/Schedules/Schedule.routes'
import analyticsRoutes from '../modules/analytics/analytics.routes'
import deliveryRoutes from '../modules/delivery/delivery.routes'

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoriaRoutes)
router.use('/addons', adicionalRoutes)
router.use('/users', userRouters)
router.use('/config', configRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/delivery', deliveryRoutes)

// Aliases legacy para no cortar el flujo actual mientras se migra el front/Postman.
router.use('/productos', productRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponsRoutes)
router.use('/user', userRouters)
router.use('/adicionales', adicionalRoutes)
router.use('/categorias', categoriaRoutes)
router.use('/configuracion', configRoutes)
router.use('/analiticas', analyticsRoutes)

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
