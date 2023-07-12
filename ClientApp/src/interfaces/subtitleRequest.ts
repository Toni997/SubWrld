import { IID, ILanguageSelection } from './common'
import { IUserRef } from './user'

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

export interface ISubtitleRequest extends IID {
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
  user: IUserRef
  subtitleId: string | null
  subtitle: ISubtitleForRequest
}

export interface ISubtitleForRequest extends IID {
  _id: string
}
