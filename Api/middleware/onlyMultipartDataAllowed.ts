import { NextFunction, Request, Response } from 'express'

const onlyMultipartDataAllowed = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.is('multipart/form-data')) {
    next()
  } else {
    res.status(400).json({
      error: 'Invalid request format. Only multipart/form-data is allowed.',
    })
  }
}

export default onlyMultipartDataAllowed
