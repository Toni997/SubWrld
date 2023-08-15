import { Request, Response } from 'express'
import { CustomError } from './errorMiddleware'
import Joi from 'joi'

const validateBody =
  (validator: Joi.ObjectSchema<any>) =>
  (req: Request, res: Response, next: () => void) => {
    const { error } = validator.validate(req.body)
    if (error) throw new CustomError(error.details[0].message, 400)
    next()
  }

export { validateBody }
