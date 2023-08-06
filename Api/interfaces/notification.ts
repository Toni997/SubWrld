import { IID, ITimestamps } from './common'

export interface INotificationForm {
  text: string
}

export interface ICreateNotification extends INotificationForm {
  userId: number
}

export interface INotification extends IID, ITimestamps, ICreateNotification {}
