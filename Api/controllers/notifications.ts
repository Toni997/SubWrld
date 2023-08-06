import mongoose from 'mongoose'
import { IAuthUserRequest } from '../interfaces/request'
import asyncHandler from 'express-async-handler'
import Notification from '../models/notification'
import { Response } from 'express'

const pageSize = 10

// @desc get notifications for authenticated user
// @route GET /notifications
// @access Private
const getNotificationsForUser = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const pageNumber = Number(req.query.page) || 1
    const userId = req.user?._id as mongoose.Types.ObjectId

    const options = {
      page: pageNumber,
      limit: pageSize,
      sort: { createdAt: -1 },
      lean: true,
    }

    const result = await Notification.paginate({ userId }, options)

    res.json(result)
  }
)

export { getNotificationsForUser }
