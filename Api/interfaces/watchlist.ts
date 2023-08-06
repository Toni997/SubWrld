import mongoose from 'mongoose'
import { IID, ITimestamps } from './common'
import { ITVShowEpisode } from './tv-shows'

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
