import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import Announcement, {
  IAnnouncementForm,
  IAnnouncementWithTVShowTitle,
  ICreateAnnouncement,
} from '../models/announcement'
import axios from 'axios'
import { getTVShowDetailsUrl } from '../utils/tmdb-api'
import { CustomError } from '../middleware/errorMiddleware'
import { IAuthUserRequest } from '../interfaces/request'
import { Types } from 'mongoose'
import { ITVShowDetails } from '../interfaces/tv-shows'

const pageSize = 10

// @desc add new announcement for a tv show
// @route POST /announcements/tv-show/:tvShowId
// @access Admin
const addAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement: ICreateAnnouncement = req.body

  axios.get(getTVShowDetailsUrl(announcement.tvShowId))

  const instertedAnnouncement = await Announcement.create(announcement)

  res.status(201).json(instertedAnnouncement)
})

// @desc update announcement for a tv show
// @route PUT /announcements/:announcementId
// @access Admin
const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcementId = req.params.announcementId
  const announcement: IAnnouncementForm = req.body
  console.log(announcementId)
  const existingAnnouncement = await Announcement.findById(announcementId)

  if (!existingAnnouncement)
    throw new CustomError('Announcement not found', 404)

  existingAnnouncement.text = announcement.text
  await existingAnnouncement.save()

  res.status(201).json(existingAnnouncement)
})

// @desc get announcements for a tv show
// @route GET /announcements/tv-show/:tvShowId
// @access Public
const getAnnouncementsForTVShow = asyncHandler(
  async (req: Request, res: Response) => {
    const pageNumber = Number(req.query.page) || 1
    const tvShowId = Number(req.params.tvShowId)
    if (!tvShowId) throw new CustomError('Invalid parameter', 400)

    const options = {
      page: pageNumber,
      limit: pageSize,
      sort: { updatedAt: -1 },
      lean: true,
    }

    const result = await Announcement.paginate({ tvShowId }, options)

    res.json(result)
  }
)

// @desc get all announcements as paged
// @route GET /announcements
// @access Public
const getAllAnnouncements = asyncHandler(
  async (req: Request, res: Response) => {
    const pageNumber = Number(req.query.page) || 1

    const options = {
      page: pageNumber,
      limit: pageSize,
      sort: { updatedAt: -1 },
      lean: true,
    }

    const result = await Announcement.paginate({}, options)

    const announcements = result.docs as any
    for (const item of announcements) {
      const response = await axios.get(getTVShowDetailsUrl(item.tvShowId))
      const tvShow: ITVShowDetails = response.data
      item.tvShowTitle = tvShow.name
    }

    res.json(result)
  }
)

// @desc get all announcements for watchlisted tv shows only
// @route GET /announcements/watchlisted-only
// @access Private
const getAllAnnouncementsForWatchlistedTVShowOnly = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const pageNumber = Number(req.query.page) || 1
    const userId = req.user?._id as Types.ObjectId

    const announcementsQuery = Announcement.aggregate([
      {
        $lookup: {
          from: 'watchlists',
          let: { tvShowId: '$tvShowId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', userId] },
                    { $eq: ['$tvShowId', '$$tvShowId'] },
                  ],
                },
              },
            },
          ],
          as: 'watchlists',
        },
      },
      {
        $match: {
          watchlists: { $ne: [] },
        },
      },
      {
        $project: {
          _id: 1,
          tvShowId: 1,
          text: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
    ])

    const options = {
      page: pageNumber,
      limit: pageSize,
      lean: true,
    }

    const result = await Announcement.aggregatePaginate(
      announcementsQuery,
      options
    )

    for (const item of result.docs) {
      const response = await axios.get(getTVShowDetailsUrl(item.tvShowId))
      const tvShow: ITVShowDetails = response.data
      item.tvShowTitle = tvShow.name
    }

    res.json(result)
  }
)

const deleteAnnouncement = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const announcementId = req.params.announcementId
    const announcement = await Announcement.findById(announcementId)

    if (!announcement) throw new CustomError('Announcement not found', 404)

    await announcement.deleteOne()

    res.json('Success')
  }
)

export {
  addAnnouncement,
  updateAnnouncement,
  getAnnouncementsForTVShow,
  getAllAnnouncements,
  getAllAnnouncementsForWatchlistedTVShowOnly,
  deleteAnnouncement,
}
