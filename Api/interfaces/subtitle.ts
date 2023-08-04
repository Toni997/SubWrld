import { IID, ITimestamps } from './common'
import { IUserResponseRef } from './user'

export interface ISubtitleResponseRef extends IID, ITimestamps {
  userId: IUserResponseRef
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
  filePath: string | null
  isConfirmed: boolean
  downloads: number
  tvShowTitle?: string
}
