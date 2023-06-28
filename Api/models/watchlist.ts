import mongoose, { Schema, model } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/mongoose'
import { ITVShowDetails, ITVShowEpisode } from '../interfaces/tv-shows'

export interface IUpdateWatchlist {
  userId: mongoose.Types.ObjectId
  tvShowId: number
}

export interface IWatchlistWithTVShowDetails extends IWatchlist {
  title: string
  status: string
  next_episode_to_air: ITVShowEpisode
}

export interface IWatchlist extends IID, ITimestamps, IUpdateWatchlist {}

const watchlistSchema = new Schema(
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
  },
  {
    timestamps: true,
  }
)

watchlistSchema.index({ userId: 1, tvSHowId: 1 })

const Watchlist = model<IWatchlist>('Watchlist', watchlistSchema)

export default Watchlist
