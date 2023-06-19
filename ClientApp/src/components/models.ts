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

export interface ITVShowInfo {
  id: number
  backdrop_path: string
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string
  first_air_date: string
  name: string
  vote_average: number
  vote_count: number
  genre_names: string[]
}
