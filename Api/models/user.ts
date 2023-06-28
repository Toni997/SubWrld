import mongoose, { Schema, model, Types, Model } from 'mongoose'
import bcrypt, { decodeBase64 } from 'bcryptjs'
import { IID, ITimestamps } from '../interfaces/mongoose'

export interface IUpdateUser extends IID {
  username: string
  email: string
  password: string
}

export interface IUser extends IID, ITimestamps, IUserMethods {
  username: string
  email: string
  password: string
  isAdmin: boolean
  darkMode: boolean
}

export interface IUserWithRefs extends IUser {
  watchlist: mongoose.Types.ObjectId[]
  watchedEpisodes: mongoose.Types.ObjectId[]
}

interface IUserMethods {
  matchPassword(password: string): Promise<boolean>
}

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
      unique: true,
      validate: {
        validator: (v: any) => {
          const re =
            /^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
          return !v || !v.trim().length || re.test(v)
        },
        message: 'Username not valid',
      },
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
      validate: {
        validator: (v: any) => {
          const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
          return !v || !v.trim().length || re.test(v)
        },
        message: 'Email not valid',
      },
    },
    password: {
      type: String,
      required: true,
      minLength: [6, 'Password too short'],
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    reputation: {
      type: Number,
      required: true,
      default: 0,
    },
    darkMode: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

const User = model<IUser>('User', userSchema)

export default User
