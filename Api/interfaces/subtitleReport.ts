import mongoose from 'mongoose'
import { ReportStatus } from '../utils/reportStatus'
import { IID, ITimestamps } from './common'
import { ISubtitleWithTVShowTitle } from './subtitle'
import { IUserResponseRef } from './user'

export interface ISubtitleReportForm {
  reason: string
}

export interface ICreateSubtitleReport extends ISubtitleReportForm {
  subtitleId: mongoose.Types.ObjectId | null
}

export interface ISubtitleReport
  extends IID,
    ITimestamps,
    ICreateSubtitleReport {
  userId: mongoose.Types.ObjectId
  status: ReportStatus
}

export interface ISubtitleReportResponse extends IID, ITimestamps {
  reason: string
  status: ReportStatus
  userId: IUserResponseRef
  subtitleId: ISubtitleWithTVShowTitle
}
