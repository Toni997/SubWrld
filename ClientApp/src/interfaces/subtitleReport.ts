import { ReportStatus } from 'src/utils/reportStatus'
import { IID, ITimestamps } from './common'
import { ISubtitleWithTVShowTitle } from './subtitle'
import { IUserRefWithReputation } from './user'

export interface ISubtitleReport extends IID, ITimestamps {
  reason: string
  status: ReportStatus
  userId: IUserRefWithReputation
  subtitleId: ISubtitleWithTVShowTitle
}
