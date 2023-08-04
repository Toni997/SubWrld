import jwt, { JwtPayload } from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User, { IUser } from '../models/user'
import { IAuthUserRequest } from '../interfaces/request'
import { CustomError } from './errorMiddleware'

const authenticate = asyncHandler(async (req: IAuthUserRequest, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    throw new CustomError('Not authorized', 401)
  }

  const token = req.headers.authorization.split(' ')[1]
  let decoded: JwtPayload
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as jwt.Secret
    ) as JwtPayload
  } catch (err: any) {
    throw new CustomError('Not authorized', 401)
  }

  req.user = (await User.findById(decoded._id).select('-password')) as IUser
  next()
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

const requireAdminRights = asyncHandler(
  async (req: IAuthUserRequest, res, next) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer')
    ) {
      throw new CustomError('Not authorized', 401)
    }

    const token = req.headers.authorization.split(' ')[1]
    let decoded: JwtPayload
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as jwt.Secret
      ) as JwtPayload
    } catch (err: any) {
      throw new CustomError('Not authorized', 401)
    }

    req.user = (await User.findById(decoded._id).select('-password')) as IUser
    if (!req.user.isAdmin)
      throw new CustomError('Admin rights required to perform this action', 403)
    next()
  }
)

export { authenticate, passUserToRequest, requireAdminRights }
