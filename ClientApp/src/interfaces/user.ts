export interface UserInfo {
  _id: string
  username: string
  email: string
  isAdmin: boolean
}

export interface AuthState {
  isLoading: boolean
  userInfo: null | UserInfo
}
