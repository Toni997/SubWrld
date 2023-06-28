export interface ISubtitleRequestForm {
  tvShowId: number
  season: number
  episode: number
  preferredLanguage: ILanguageSelection | null
  preferredFrameRate: number | null
  preferForHearingImpaired: boolean
  comment: string | null
}

export interface ICreateSubtitleRequest {
  tvShowId: number
  season: number
  episode: number
  preferredLanguage: string
  preferredFrameRate: number | null
  preferForHearingImpaired: boolean
  comment: string | null
}

export interface ISubtitleRequest {
  _id: string
  userId: string
  tvShowId: number
  season: number
  episode: number
  episodeId: number
  preferredLanguage: string
  preferredFrameRate: number | null
  preferForHearingImpaired: boolean
  isFulfilled: boolean
  comment: string | null
  createdAt: string
  updatedAt: string
  user: ISubtitleRequestUser
  subtitleId: string | null
}

export interface ILanguageSelection {
  actualValue: string
  displayValue: string
}

export interface ISubtitleRequestUser {
  _id: number
  username: string
  reputation: number
  createdAt: string
}
