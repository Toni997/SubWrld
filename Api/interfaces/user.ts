import { IID } from './common'

export interface IUserResponseRef extends IID {
  username: string
  isAdmin: boolean
  reputation: number
}
