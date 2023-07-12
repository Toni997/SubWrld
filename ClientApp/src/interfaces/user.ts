export interface UserInfo {
  _id: string
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

export interface IUserRef {
  _id: string
  username: string
  reputation: number
  createdAt: string
}
