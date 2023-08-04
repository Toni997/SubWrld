import mongoose, { PaginateModel, Schema, model } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/common'
import { ReportStatus } from '../utils/reportStatus'
import paginate from 'mongoose-paginate-v2'

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

const subtitleReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subtitleId: {
      type: Schema.Types.ObjectId,
      ref: 'Subtitle',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      enum: ReportStatus,
      default: ReportStatus.Pending,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

subtitleReportSchema.index({ userId: 1, subtitleId: 1 })

subtitleReportSchema.plugin(paginate)

const SubtitleReport = model<ISubtitleReport, PaginateModel<ISubtitleReport>>(
  'SubtitleReport',
  subtitleReportSchema
)

export default SubtitleReport
