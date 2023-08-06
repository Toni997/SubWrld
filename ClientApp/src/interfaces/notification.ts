import { IID, ITimestamps } from './common'

export interface INotification extends IID, ITimestamps {
  text: string
}
