import { Router } from 'express'
import {
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminGetTransactions,
  adminGetSubscriptions,
  adminGrantSubscription,
} from '../controllers/admin.pricing.controller.js'
import { protect, authorize } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(authorize('admin'))

router.route('/plans')
  .get(adminGetPlans)
  .post(adminCreatePlan)

router.route('/plans/:id')
  .put(adminUpdatePlan)
  .delete(adminDeletePlan)

router.get('/transactions', adminGetTransactions)
router.get('/subscriptions', adminGetSubscriptions)
router.post('/grant-subscription', adminGrantSubscription)

export default router
