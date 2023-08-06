import mongoose from 'mongoose'
import { IID, ITimestamps } from './common'

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
