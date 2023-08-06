import { Schema, model } from 'mongoose'
import { IWatchlist } from '../interfaces/watchlist'

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
