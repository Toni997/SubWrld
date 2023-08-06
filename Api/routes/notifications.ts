import express from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { getNotificationsForUser } from '../controllers/notifications'

const notificationRouter = express.Router()

notificationRouter.get('', authenticate, getNotificationsForUser)

export default notificationRouter
