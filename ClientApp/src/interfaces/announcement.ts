import { IID, ITimestamps } from './common'

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
