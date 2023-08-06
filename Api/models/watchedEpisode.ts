import { Schema, model } from 'mongoose'
import { IWatchedEpisode } from '../interfaces/watchedEpisode'

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
