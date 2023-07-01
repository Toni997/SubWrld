import jwt, { JwtPayload } from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User, { IUser } from '../models/user'
import { IAuthUserRequest } from '../interfaces/request'
import { CustomError } from './errorMiddleware'

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

      req.user = (await User.findById(decoded._id).select('-password')) as IUser
      next()
    } catch (error) {
      console.error(error)
      throw new CustomError('Not authorized, token failed', 401)
    }
  }

  if (!token) throw new CustomError('Not authorized, no token', 401)
})

const passUserToRequest = asyncHandler(
  async (req: IAuthUserRequest, res, next) => {
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

        req.user = (await User.findById(decoded._id).select(
          '-password'
        )) as IUser
      } catch (error) {
        console.error(error)
      }
    }
    next()
  }
)

export { authenticate, passUserToRequest }
