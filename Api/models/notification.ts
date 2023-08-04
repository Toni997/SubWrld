import mongoose, { Schema, model } from 'mongoose'
import { IID, ITimestamps } from '../interfaces/common'

export interface INotificationForm {
  text: string
}

export interface ICreateNotification extends INotificationForm {
  userId: number
}

export interface INotification extends IID, ITimestamps, ICreateNotification {}

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

const Notification = model<INotification>('Notification', notificationSchema)

export default Notification
