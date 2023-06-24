import mongoose from 'mongoose'

export interface ITimestamps {
  createdAt: string
  updatedAt: string
}

export interface IID {
  _id: mongoose.Types.ObjectId
}
