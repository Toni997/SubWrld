import mongoose from 'mongoose'

export interface IPaginated<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

export interface ITimestamps {
  createdAt: string
  updatedAt: string
}

export interface IID {
  _id: mongoose.Types.ObjectId
}
