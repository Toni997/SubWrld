import { Request, Response } from 'express'
import { CustomError } from './errorMiddleware'
import Joi from 'joi'

const validateBody =
  (validator: Joi.ObjectSchema<any>) =>
  (req: Request, res: Response, next: () => void) => {
    console.log('IS IT valid123')
    const { error } = validator.validate(req.body)
    if (error) throw new CustomError(error.details[0].message, 400)
    console.log('it is valid123')
    next()
  }

export { validateBody }
