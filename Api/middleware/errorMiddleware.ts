import { NextFunction, Request, Response } from 'express'

export class CustomError extends Error {
  statusCode: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.statusCode = statusCode || 500
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('err', err)
  const statusCode =
    err.statusCode ||
    err.response?.status ||
    (res.statusCode === 200 ? 500 : res.statusCode)
  res.status(statusCode)
  res.json({
    message: err.message || 'Error occurred',
    stack: process.env.NODE_ENV === 'prod' ? null : err.stack,
  })
}

export { notFound, errorHandler }
