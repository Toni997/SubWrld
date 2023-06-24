import mongoose, { Schema, model } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/mongoose'

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
      index: true,
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
  },
  {
    timestamps: true,
  }
)

const WatchedEpisode = model<IWatchedEpisode>(
  'WatchedEpisode',
  watchedEpisodeSchema
)

export default WatchedEpisode
