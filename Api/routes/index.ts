import asyncHandler from 'express-async-handler'
import express, { NextFunction, Request, Response } from 'express'

const indexRouter = express.Router()

indexRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.json({ hello: 'world' })
  })
)

export default indexRouter
