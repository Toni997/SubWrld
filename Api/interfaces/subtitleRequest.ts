import mongoose from 'mongoose'
import { IID, ITimestamps } from './common'

export interface ICreateSubtitleRequest {
  userId: mongoose.Types.ObjectId
  tvShowId: number
  season: number
  episode: number
  episodeId: number
  preferredLanguage: string
  preferredFrameRate: number | null
  preferForHearingImpaired: boolean
  comment: string | null
}

export interface ISubtitleRequest
  extends IID,
    ITimestamps,
    ICreateSubtitleRequest {
  subtitleId: mongoose.Types.ObjectId | null
}
