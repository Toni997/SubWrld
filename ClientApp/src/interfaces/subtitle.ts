import { IID, ILanguageSelection, ITimestamps } from './common'
import { IUserRef, IUserRefWithReputation } from './user'

export interface ISubtitleForm {
  tvShowId: number
  season: number
  episode: number
  language: ILanguageSelection | null
  frameRate: number | null
  forHearingImpaired: boolean
  isWorkInProgress: boolean
  onlyForeignLanguage: boolean
  uploaderIsAuthor: boolean
  release: string | null
  files: File[]
}

export interface IUpsertSubtitle {
  tvShowId: number
  season: number
  episode: number
  language: string
  frameRate: number
  forHearingImpaired: boolean
  isWorkInProgress: boolean
  onlyForeignLanguage: boolean
  uploaderIsAuthor: boolean
  release: string
  subtitleRequestId: string | null
  files: File[]
}

export interface ISubtitle extends IID, ITimestamps {
  user: IUserRef
  tvShowId: number
  season: number
  episode: number
  episodeId: number
  language: string
  frameRate: number
  forHearingImpaired: boolean
  isWorkInProgress: boolean
  onlyForeignLanguage: boolean
  uploaderIsAuthor: boolean
  release: string
  subtitleRequestId: string | null
  filePath: string | null
  downloads: number
  thankedByCount: number
  isThankedByUser: boolean
  isConfirmed: boolean
}

export interface ISubtitleRef extends IID, ITimestamps {
  userId: IUserRefWithReputation
  tvShowId: number
  season: number
  episode: number
  episodeId: number
  language: string
  frameRate: number
  forHearingImpaired: boolean
  isWorkInProgress: boolean
  onlyForeignLanguage: boolean
  uploaderIsAuthor: boolean
  release: string
  filePath: string | null
  isConfirmed: boolean
  downloads: number
  tvShowTitle?: string
}
