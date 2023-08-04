import { Schema, model, PaginateModel } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/common'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

export interface IAnnouncementForm {
  text: string
}

export interface ICreateAnnouncement extends IAnnouncementForm {
  tvShowId: number
}

export interface IAnnouncement extends IID, ITimestamps, ICreateAnnouncement {}

export interface IAnnouncementWithTVShowTitle extends IAnnouncement {
  tvShowTitle: string
}

const announcementSchema = new Schema(
  {
    tvShowId: {
      type: Number,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

announcementSchema.plugin(paginate)
announcementSchema.plugin(aggregatePaginate)

const Announcement = model<IAnnouncement, PaginateModel<IAnnouncement>>(
  'Announcement',
  announcementSchema
)

export default Announcement
