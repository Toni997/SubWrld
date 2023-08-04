export interface ILanguageSelection {
  actualValue: string
  displayValue: string
}

export interface IID {
  _id: string
}

export interface ITimestamps {
  createdAt: string
  updatedAt: string
}

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
