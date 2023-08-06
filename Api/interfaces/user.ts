import mongoose from 'mongoose'
import { IID, ITimestamps } from './common'

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
  reputation: number
}

export interface IUserWithRefs extends IUser {
  watchlist: mongoose.Types.ObjectId[]
  watchedEpisodes: mongoose.Types.ObjectId[]
}

interface IUserMethods {
  matchPassword(password: string): Promise<boolean>
}

export interface IUserResponseRef extends IID {
  username: string
  isAdmin: boolean
  reputation: number
}
