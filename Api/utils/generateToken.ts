import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import { IUser } from '../models/user'

const generateToken = (user: IUser) => {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: '1d',
    }
  )
}

export default generateToken
