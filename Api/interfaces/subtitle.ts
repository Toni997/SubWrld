import mongoose from 'mongoose'
import { IID, ITimestamps } from './common'
import { IUserResponseRef } from './user'

export interface ICreateSubtitleForm {
  tvShowId: string
  season: string
  episode: string
  language: string
  frameRate: string
  forHearingImpaired: string
  isWorkInProgress: string
  onlyForeignLanguage: string
  uploaderIsAuthor: string
  release: string
  subtitleRequestId: string | undefined
}

export interface IUpdateSubtitleForm {
  language: string
  frameRate: string
  forHearingImpaired: string
  isWorkInProgress: string
  onlyForeignLanguage: string
  uploaderIsAuthor: string
  release: string
}

export interface ICreateSubtitle {
  userId: mongoose.Types.ObjectId
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
  subtitleRequestId: mongoose.Types.ObjectId | null
}

export interface ISubtitle extends IID, ITimestamps, ICreateSubtitle {
  downloads: number
  thankedByCount: number
  isConfirmed: boolean
  thankedBy: mongoose.Types.ObjectId[]
}

export interface ISubtitleWithTVShowTitle extends IID, ITimestamps {
  userId: IUserResponseRef
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
