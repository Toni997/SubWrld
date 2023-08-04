import mongoose, { Schema, model, mongo } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/common'

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

const subtitleRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tvShowId: {
      type: Number,
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
    episode: {
      type: Number,
      required: true,
    },
    episodeId: {
      type: Number,
      required: true,
      index: true,
    },
    preferredLanguage: {
      type: String,
      required: true,
    },
    preferredFrameRate: {
      type: Number,
      default: null,
    },
    subtitleId: {
      type: Schema.Types.ObjectId,
      ref: 'Subtitle',
      default: null,
    },
    preferForHearingImpaired: {
      type: Boolean,
      required: true,
      default: false,
    },
    comment: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

const SubtitleRequest = model<ISubtitleRequest>(
  'SubtitleRequest',
  subtitleRequestSchema
)

export default SubtitleRequest
