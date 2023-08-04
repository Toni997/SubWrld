import mongoose from 'mongoose'
import { ReportStatus } from '../utils/reportStatus'
import { IID, ITimestamps } from './common'
import { ISubtitleResponseRef } from './subtitle'
import { IUserResponseRef } from './user'

export interface ISubtitleReportResponse extends IID, ITimestamps {
  reason: string
  status: ReportStatus
  userId: IUserResponseRef
  subtitleId: ISubtitleResponseRef
}
