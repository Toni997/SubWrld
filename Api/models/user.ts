import { Schema, model, Types, Model } from 'mongoose'
import bcrypt, { decodeBase64 } from 'bcryptjs'
import ITimestamps from '../interfaces/timestamps'

interface IID {
  _id: Types.ObjectId
}

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
}

interface IUserMethods {
  matchPassword(password: string): Promise<boolean>
}

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
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

User.collection.createIndex({ username: 1 }, { unique: true })
User.collection.createIndex({ email: 1 }, { unique: true })

export default User
