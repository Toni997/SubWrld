import { PaginateModel, Schema, model } from 'mongoose'
import { INotification } from '../interfaces/notification'
import paginate from 'mongoose-paginate-v2'

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

notificationSchema.plugin(paginate)

const Notification = model<INotification, PaginateModel<INotification>>(
  'Notification',
  notificationSchema
)

export default Notification
