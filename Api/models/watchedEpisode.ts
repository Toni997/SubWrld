import mongoose, { Schema, model } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/common'

export interface IUpdateWatchedEpisode {
  userId: mongoose.Types.ObjectId
  tvShowId: number
  season: number
  episode: number
  episodeId: number
}

export interface IUpdateWatchedEpisodeWithMarkPrevious
  extends IUpdateWatchedEpisode {
  markPrevious: boolean
}

export interface IWatchedEpisode
  extends IID,
    ITimestamps,
    IUpdateWatchedEpisode {}

const watchedEpisodeSchema = new Schema(
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
    },
  },
  {
    timestamps: true,
  }
)

watchedEpisodeSchema.index({ userId: 1, tvShowId: 1 })
watchedEpisodeSchema.index({ userId: 1, episodeId: 1 })

const WatchedEpisode = model<IWatchedEpisode>(
  'WatchedEpisode',
  watchedEpisodeSchema
)

export default WatchedEpisode
