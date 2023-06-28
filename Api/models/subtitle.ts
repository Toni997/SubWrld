import mongoose, { Schema, model, mongo } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/mongoose'

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
  subtitleId: string | null
}

export interface ISubtitle extends IID, ITimestamps, ICreateSubtitle {
  filePath: string | null
  downloads: number
  thankedByCount: number
  isConfirmed: boolean
}

const subtitleSchema = new Schema(
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
    language: {
      type: String,
      required: true,
    },
    frameRate: {
      type: Number,
      required: true,
      default: null,
    },
    subtitleRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'Subtitle',
      default: null,
    },
    isWorkInProgress: {
      type: Boolean,
      required: true,
      default: false,
    },
    forHearingImpaired: {
      type: Boolean,
      required: true,
      default: false,
    },
    onlyForeignLanguage: {
      type: Boolean,
      required: true,
      default: false,
    },
    release: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      default: null,
    },
    downloads: {
      type: Number,
      required: true,
      default: 0,
    },
    uploaderIsAuthor: {
      required: true,
      default: false,
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    thankedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

subtitleSchema.virtual('thankedByCount').get(function () {
  return this.thankedBy.length
})

const Subtitle = model<ISubtitle>('Subtitle', subtitleSchema)

export default Subtitle
