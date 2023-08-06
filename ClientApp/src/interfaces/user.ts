import { IID, ITimestamps } from './common'

export interface UserInfo extends IID {
  username: string
  email: string
  isAdmin: boolean
}

export interface AuthState {
  isLoading: boolean
  darkMode: boolean
  isSettingDarkMode: boolean
  userInfo: null | UserInfo
}

export interface IUserRef extends IID {
  username: string
  reputation: number
  createdAt: string
}

export interface IUserRefWithReputation extends IID {
  username: string
  isAdmin: boolean
  reputation: number
}

export interface IUser extends IID, ITimestamps {
  username: string
  email: string
  reputation: number
  isAdmin: boolean
  darkMode: boolean
}
