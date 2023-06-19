import jwt, { JwtPayload } from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User, { IUser } from '../models/user'
import { IAuthUserRequest } from '../interfaces/request'

const authenticate = asyncHandler(async (req: IAuthUserRequest, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as jwt.Secret
      ) as JwtPayload

      req.user = (await User.findById(decoded.id).select('-password')) as IUser

      next()
    } catch (error) {
      console.error(error)
      res.status(401)
      throw new Error('Not authorized, token failed')
    }
  }

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }
})

export { authenticate }
