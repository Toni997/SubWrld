import { Request } from 'express'
import { IUser, IUpdateUser } from './user'

export interface IGetUserRequest extends Request {
  user?: IUser
}

export interface IAuthUserRequest extends IGetUserRequest {}

export interface IUpdateUserRequest extends Request {
  user?: IUpdateUser
}

export interface ISearchTVShowRequest {
  query: string
}
