import { Schema, model, PaginateModel } from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import { IAnnouncement } from '../interfaces/announcement'

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
