import express from 'express'
import { getComments, createComment } from '../controllers/comment.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect)

router.route('/essay/:essayId')
  .get(getComments)
  .post(createComment)

export default router
