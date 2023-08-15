import { Schema, model, PaginateModel } from 'mongoose'
import bcrypt from 'bcryptjs'
import paginate from 'mongoose-paginate-v2'
import { IUser } from '../interfaces/user'

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
  if (!this.isModified('password')) next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.plugin(paginate)

const User = model<IUser, PaginateModel<IUser>>('User', userSchema)

export default User
