import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { ICreateSubtitleRequest } from '../interfaces/subtitleRequest'
import { IUser } from '../interfaces/user'
import { IAuthUserRequest } from '../interfaces/request'
import axios from 'axios'
import {
  getTVShowDetailsUrl,
  getTVShowEpisodeDetailsUrl,
} from '../utils/tmdb-api'
import { ITVShowDetails, ITVShowEpisode } from '../interfaces/tv-shows'
import mongoose from 'mongoose'
import {
  ICreateSubtitle,
  ICreateSubtitleForm,
  IUpdateSubtitleForm,
} from '../interfaces/subtitle'
import { v4 as uuidv4 } from 'uuid'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import {
  allowedMimeTypes,
  subtitlesFolderPath,
  tempFolderPath,
} from '../config/multer'
import { CustomError } from '../middleware/errorMiddleware'
import { Magic, MAGIC_MIME_TYPE } from 'mmmagic'
import { convertStringifiedBoolean } from '../utils/convertStringifiedBoolean'
import { ISubtitleReportForm } from '../interfaces/subtitleReport'
import { ReportStatus } from '../utils/reportStatus'
import { ISubtitleReportResponse } from '../interfaces/subtitleReport'
import SubtitleReport from '../models/subtitleReport'
import SubtitleRequest from '../models/subtitleRequest'
import User from '../models/user'
import { ISubtitleWithTVShowTitle } from '../interfaces/subtitle'
import Subtitle from '../models/subtitle'

const pageSize = 10

const ensureAllowedMimeTypeForFiles = (files: Express.Multer.File[]) => {
  const magic = new Magic(MAGIC_MIME_TYPE)
  for (const file of files) {
    const filePath = path.join(tempFolderPath, file.filename)
    magic.detectFile(filePath, function (err, result) {
      if (err) throw new CustomError('Unsupported files', 415)
      if (!allowedMimeTypes.includes(result as string)) {
        throw new CustomError('Unsupported files', 415)
      }
    })
  }
}

const uploadAndZipFiles = (files: Express.Multer.File[]) => {
  const zipFileName = uuidv4() + '.zip'
  const zipFilePath = path.join(subtitlesFolderPath, zipFileName)

  const output = fs.createWriteStream(zipFilePath)

  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  archive.pipe(output)

  for (const file of files) {
    const filePath = path.join(tempFolderPath, file.filename)
    archive.file(filePath, { name: file.originalname })
  }

  archive.finalize()
  return zipFileName
}

// @desc get all subtitles
// @route GET /subtitles
// @access Public
const getAllSubtitles = asyncHandler(async (req: Request, res: Response) => {
  const pageNumber = Number(req.query.page) || 1

  const options = {
    page: pageNumber,
    limit: pageSize,
    select: '-thankedBy -userId',
    populate: {
      path: 'userId',
      select: '_id username reputation isAdmin',
    },
    sort: { updatedAt: -1 },
    lean: true,
  }

  const result = await Subtitle.paginate({}, options)

  const subtitles = result.docs as unknown as ISubtitleWithTVShowTitle[]

  for (const item of subtitles) {
    const response = await axios.get(getTVShowDetailsUrl(item.tvShowId))
    const tvShow: ITVShowDetails = response.data
    item.tvShowTitle = tvShow.name
  }

  res.json(result)
})

// @desc get all subtitles for a specific episode
// @route GET /subtitles/:episodeId
// @access Public
const getSubtitlesForEpisode = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id
    const episodeId = Number(req.params.episodeId)

    if (!episodeId) throw new CustomError('Invalid parameter', 400)

    const subtitles = await Subtitle.aggregate([
      {
        $match: { episodeId },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $addFields: {
          isOwner: {
            $eq: ['$userId', userId],
          },
          thankedByCount: { $size: '$thankedBy' },
          isThankedByUser: { $in: [userId, '$thankedBy'] },
        },
      },
      {
        $project: {
          'user.email': 0,
          'user.password': 0,
          'user.updatedAt': 0,
          'user.createdAt': 0,
          thankedBy: 0,
        },
      },
      {
        $sort: {
          isOwner: -1,
          updatedAt: -1,
        },
      },
    ])

    res.json(subtitles)
  }
)

// @desc get all subtitles for a specific episode uploaded by authenticated user
// @route GET /subtitles/my/:episodeId
// @access Private
const getUserSubtitlesForEpisode = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const episodeId = Number(req.params.episodeId)

    if (!episodeId) throw new CustomError('Invalid parameter', 400)

    const subtitles = await Subtitle.find({
      userId,
      episodeId,
      subtitleRequestId: null,
      filePath: { $ne: null },
    })
      .select('_id language release frameRate createdAt updatedAt')
      .sort({ updatedAt: -1 })

    res.json(subtitles)
  }
)

// @desc get all subtitles by a specific user
// @route GET /subtitles/by/:userId
// @access Public
const getSubtitlesByUser = asyncHandler(async (req: Request, res: Response) => {
  const pageNumber = Number(req.query.page) || 1
  const userId = req.params.userId

  const options = {
    page: pageNumber,
    limit: pageSize,
    select: '-thankedBy -userId',
    sort: { updatedAt: -1 },
    lean: true,
  }

  const result = await Subtitle.paginate({ userId }, options)

  const subtitles = result.docs as unknown as ISubtitleWithTVShowTitle[]

  for (const item of subtitles) {
    const response = await axios.get(getTVShowDetailsUrl(item.tvShowId))
    const tvShow: ITVShowDetails = response.data
    item.tvShowTitle = tvShow.name
  }

  res.json(result)
})

// @desc Add subtitle
// @route POST /subtitles
// @access Private
const addSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user as IUser
    const subtitle: ICreateSubtitleForm = req.body
    const files = req.files as Express.Multer.File[] | undefined

    let subtitleRequest
    if (subtitle.subtitleRequestId) {
      subtitleRequest = await SubtitleRequest.findById(
        subtitle.subtitleRequestId
      )
      if (!subtitleRequest)
        throw new CustomError('Subtitle request not found', 404)

      if (
        subtitleRequest.tvShowId !== Number(subtitle.tvShowId) ||
        subtitleRequest.season !== Number(subtitle.season) ||
        subtitleRequest.episode !== Number(subtitle.episode)
      ) {
        throw new CustomError(
          'You are trying to relate a subtitle with a subtitle request made for a different episode',
          401
        )
      }

      if (!files?.length)
        throw new CustomError(
          'Subtitles related to a subtitle request must have at least one file attached',
          401
        )
    }

    if (files?.length) ensureAllowedMimeTypeForFiles(files)

    const response = await axios.get(
      getTVShowEpisodeDetailsUrl(
        subtitle.tvShowId,
        subtitle.season,
        subtitle.episode
      )
    )
    const episodeDetails: ITVShowEpisode = response.data

    const subtitleToInsert: ICreateSubtitle = {
      userId: user._id,
      tvShowId: Number(subtitle.tvShowId),
      season: Number(subtitle.season),
      episode: Number(subtitle.episode),
      episodeId: episodeDetails.id,
      language: subtitle.language,
      frameRate: Number(subtitle.frameRate),
      forHearingImpaired: convertStringifiedBoolean(
        subtitle.forHearingImpaired
      ),
      isWorkInProgress: convertStringifiedBoolean(subtitle.isWorkInProgress),
      onlyForeignLanguage: convertStringifiedBoolean(
        subtitle.onlyForeignLanguage
      ),
      uploaderIsAuthor: convertStringifiedBoolean(subtitle.uploaderIsAuthor),
      release: subtitle.release,
      subtitleRequestId: subtitle.subtitleRequestId
        ? new mongoose.Types.ObjectId(subtitle.subtitleRequestId)
        : null,
      filePath: null,
    }

    if (files?.length) {
      const zipFilePath = uploadAndZipFiles(files)
      subtitleToInsert.filePath = zipFilePath
    }

    const insertedSubtitle = await Subtitle.create(subtitleToInsert)

    if (subtitleRequest) {
      subtitleRequest.subtitleId = insertedSubtitle._id
      await subtitleRequest.save()
    }

    res.status(201).json(insertedSubtitle)
  }
)

// @desc Update subtitle
// @route PUT /subtitles/:subtitleId
// @access Private
const updateSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user as IUser
    const subtitle: IUpdateSubtitleForm = req.body
    const subtitleId = req.params.subtitleId
    const files = req.files as Express.Multer.File[] | undefined

    const subtitleToUpdate = await Subtitle.findById(subtitleId)

    if (!subtitleToUpdate) throw new CustomError('Subtitle not found', 404)

    if (!user._id.equals(subtitleToUpdate.userId) && !user.isAdmin)
      throw new CustomError('Not authorized', 403)

    if (subtitleToUpdate.isConfirmed)
      throw new CustomError("Can't update a confirmed subtitle", 409)

    const oldFilePath = subtitleToUpdate.filePath

    if (files) ensureAllowedMimeTypeForFiles(files)

    subtitleToUpdate.language = subtitle.language
    subtitleToUpdate.frameRate = Number(subtitle.frameRate)
    subtitleToUpdate.forHearingImpaired = convertStringifiedBoolean(
      subtitle.forHearingImpaired
    )
    subtitleToUpdate.isWorkInProgress = convertStringifiedBoolean(
      subtitle.isWorkInProgress
    )
    subtitleToUpdate.onlyForeignLanguage = convertStringifiedBoolean(
      subtitle.onlyForeignLanguage
    )
    subtitleToUpdate.uploaderIsAuthor = convertStringifiedBoolean(
      subtitle.uploaderIsAuthor
    )
    subtitleToUpdate.release = subtitle.release

    if (files?.length) {
      const zipFilePath = uploadAndZipFiles(files)
      subtitleToUpdate.filePath = zipFilePath

      if (oldFilePath) {
        const oldFileFullPath = path.join(subtitlesFolderPath, oldFilePath)
        fs.unlinkSync(oldFileFullPath)
      }
    }

    await subtitleToUpdate.save()

    res.status(200).json(subtitleToUpdate)
  }
)

// @desc delete subtitle
// @route DELETE /subtitles/:requestId
// @access Private
const deleteSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const isAdmin = req.user?.isAdmin as boolean
    const subtitleId = req.params.subtitleId

    const subtitle = await Subtitle.findById(subtitleId)

    if (!subtitle) throw new CustomError('Subtitle request not found', 404)

    if (!subtitle.userId.equals(userId) && !isAdmin)
      throw new CustomError('Not authorized', 403)

    if (subtitle.subtitleRequestId) {
      const relatedSubtitleRequest = await SubtitleRequest.findById(
        subtitle.subtitleRequestId
      )
      if (relatedSubtitleRequest) {
        relatedSubtitleRequest.subtitleId = null
        await relatedSubtitleRequest.save()
      }
    }
    await subtitle.deleteOne()

    res.json('Removed subtitle')
  }
)

// @desc download subtitle
// @route GET /subtitles/:subtitleId
// @access Public
const downloadSubtitle = asyncHandler(async (req: Request, res: Response) => {
  const subtitleId = req.params.subtitleId
  const subtitle = await Subtitle.findById(subtitleId)

  if (!subtitle || !subtitle.filePath)
    throw new CustomError('Subtitle not found', 404)

  const response = await axios.get(getTVShowDetailsUrl(subtitle.tvShowId))
  const tvShowDetails: ITVShowDetails = response.data

  const tvShowName = tvShowDetails.name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .replace(/\s+/g, '.')
  const seasonAndEpisode = `S${subtitle.season}E${subtitle.episode}`
  const extension = 'zip'

  const fullDownloadFileName = `${tvShowName}.${seasonAndEpisode}.${subtitle.release}.${subtitle.language}.${extension}`
  const filePath = path.join(subtitlesFolderPath, subtitle.filePath)

  res.download(filePath, fullDownloadFileName, async err => {
    if (err) throw new Error('Could not send file')
    subtitle.downloads += 1
    await subtitle.save()
  })
})

// @desc thank subtitle uploader
// @route POST /subtitles/thanks/:subtitleId
// @access Public
const thankSubtitleUploader = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const subtitleId = req.params.subtitleId
    const subtitle = await Subtitle.findById(subtitleId)

    if (!subtitle) throw new CustomError('Subtitle not found', 404)

    if (subtitle.userId.equals(userId))
      throw new CustomError("You can't thank for a subtitle you uploaded", 409)

    if (subtitle.thankedBy.includes(userId))
      throw new CustomError('Already thanked for this subtitle', 409)

    subtitle.thankedBy.push(userId)
    await subtitle.save()

    const uploader = await User.findById(subtitle.userId)
    if (uploader) {
      uploader.reputation += 1
      uploader.save()
    }

    res.status(201).json('Success')
  }
)

// @desc confirm subtitle
// @route PATCH /subtitles/confirm/:subtitleId
// @access Admin
const confirmSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const subtitleId = req.params.subtitleId
    const subtitle = await Subtitle.findById(subtitleId)

    if (!subtitle) throw new CustomError('Subtitle not found', 404)

    if (subtitle.isConfirmed)
      throw new CustomError('Already confirmed this subtitle', 409)

    if (subtitle.isWorkInProgress)
      throw new CustomError(
        "Can't confirm a subtitle that's a work in progress",
        409
      )

    subtitle.isConfirmed = true
    await subtitle.save()

    const uploader = await User.findById(subtitle.userId)
    if (uploader) {
      uploader.reputation += 50
      uploader.save()
    }

    res.json('Success')
  }
)

// @desc confirm subtitle
// @route PATCH /subtitles/confirm/:subtitleId
// @access Admin
const fulfillRequestWithExistingSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const requestId = req.params.requestId
    const subtitleId = req.params.subtitleId

    const request = await SubtitleRequest.findById(requestId)
    if (!request) throw new CustomError('Request not found', 404)

    if (request.subtitleId)
      throw new CustomError('This request has already been fulfilled', 409)

    const subtitle = await Subtitle.findById(subtitleId)
    if (!subtitle) throw new CustomError('Subtitle not found', 404)

    if (!subtitle.userId.equals(userId))
      throw new CustomError('Not authorized', 403)

    if (subtitle.subtitleRequestId)
      throw new CustomError(
        'This subtitle is already related to another request',
        409
      )

    request.subtitleId = subtitle._id
    await request.save()

    subtitle.subtitleRequestId = request._id
    await subtitle.save()

    res.json('Success')
  }
)

// @desc get all pending subtitle reports
// @route PATCH /subtitles/reports/pending
// @access Admin
const getPendingSubtitleReports = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const pageNumber = Number(req.query.page) || 1

    const options = {
      page: pageNumber,
      limit: pageSize,
      sort: { updatedAt: -1 },
      populate: [
        {
          path: 'subtitleId',
          select: '-thankedBy',
          populate: {
            path: 'userId',
            select: '_id username isAdmin reputation',
          },
        },
        { path: 'userId', select: '_id username isAdmin reputation' },
      ],
      lean: true,
    }

    const result = await SubtitleReport.paginate(
      { status: ReportStatus.Pending },
      options
    )

    const reports = result.docs as unknown as ISubtitleReportResponse[]

    for (const item of reports) {
      const response = await axios.get(
        getTVShowDetailsUrl(item.subtitleId.tvShowId)
      )
      const tvShow: ITVShowDetails = response.data
      item.subtitleId.tvShowTitle = tvShow.name
    }

    res.json(result)
  }
)

// @desc get all approved subtitle reports
// @route PATCH /subtitles/reports/approved
// @access Admin
const getApprovedSubtitleReports = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const pageNumber = Number(req.query.page) || 1

    const options = {
      page: pageNumber,
      limit: pageSize,
      sort: { updatedAt: -1 },
      populate: [{ path: 'userId', select: '_id username isAdmin reputation' }],
      lean: true,
    }

    const result = await SubtitleReport.paginate(
      { status: ReportStatus.Approved },
      options
    )

    res.json(result)
  }
)

// @desc get all rejected subtitle reports
// @route PATCH /subtitles/reports/rejected
// @access Admin
const getRejectedSubtitleReports = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const pageNumber = Number(req.query.page) || 1

    const options = {
      page: pageNumber,
      limit: pageSize,
      sort: { updatedAt: -1 },
      populate: [
        {
          path: 'subtitleId',
          select: '-thankedBy',
          populate: {
            path: 'userId',
            select: '_id username isAdmin reputation',
          },
        },
        { path: 'userId', select: '_id username isAdmin reputation' },
      ],
      lean: true,
    }

    const result = await SubtitleReport.paginate(
      { status: ReportStatus.Rejected },
      options
    )

    const reports = result.docs as unknown as ISubtitleReportResponse[]

    for (const item of reports) {
      const response = await axios.get(
        getTVShowDetailsUrl(item.subtitleId.tvShowId)
      )
      const tvShow: ITVShowDetails = response.data
      item.subtitleId.tvShowTitle = tvShow.name
    }

    res.json(result)
  }
)

// @desc report subtitle
// @route PATCH /subtitles/report/:subtitleId
// @access Private
const reportSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const subtitleId = req.params.subtitleId
    const report: ISubtitleReportForm = req.body

    const subtitle = await Subtitle.findById(subtitleId).populate('userId')

    if (!subtitle) throw new CustomError('Subtitle not found', 404)

    if (subtitle.userId._id.equals(userId))
      throw new CustomError("You can't report your own subtitle", 409)

    const uploader = subtitle.userId as unknown as IUser

    if (uploader.isAdmin)
      throw new CustomError("You can't report an official subtitle", 409)

    if (subtitle.isConfirmed)
      throw new CustomError("You can't report a confirmed subtitle", 409)

    const foundReport = await SubtitleReport.findOne({
      userId,
      subtitleId,
    })

    if (foundReport)
      throw new CustomError('You have already reported this subtitle', 409)

    const insertedReport = await SubtitleReport.create({
      userId,
      subtitleId,
      reason: report.reason,
    })

    res.status(201).json(insertedReport)
  }
)

// @desc approve report
// @route PATCH /subtitles/report/approve/:reportId
// @access Admin
const approveSubtitleReport = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const reportId = req.params.reportId

    const report = await SubtitleReport.findById(reportId)

    if (!report) throw new CustomError('Report not found', 404)

    if (report.status !== ReportStatus.Pending)
      throw new CustomError('This report has already been handled', 409)

    const subtitle = await Subtitle.findById(report.subtitleId)
    if (subtitle) {
      if (subtitle.subtitleRequestId) {
        const subtitleRequest = await SubtitleRequest.findById(
          subtitle.subtitleRequestId
        )
        if (subtitleRequest) {
          subtitleRequest.subtitleId = null
          subtitleRequest.save()
        }
      }
      await subtitle.deleteOne()
    }

    report.status = ReportStatus.Approved
    await report.save()

    res.json('Success')
  }
)

// @desc reject report
// @route PATCH /subtitles/report/approve/:reportId
// @access Admin
const rejectSubtitleReport = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const reportId = req.params.reportId

    const report = await SubtitleReport.findById(reportId)

    if (!report) throw new CustomError('Report not found', 404)

    if (report.status !== ReportStatus.Pending)
      throw new CustomError('This report has already been handled', 409)

    report.status = ReportStatus.Rejected
    await report.save()

    res.json('Report rejected')
  }
)

// @desc add subtite request
// @route POST /subtitles/requests
// @access Public
const addSubtitleRequest = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user as IUser
    const subtitleRequest: ICreateSubtitleRequest = req.body

    const response = await axios.get(
      getTVShowEpisodeDetailsUrl(
        subtitleRequest.tvShowId,
        subtitleRequest.season,
        subtitleRequest.episode
      )
    )
    const episodeDetails: ITVShowEpisode = response.data

    subtitleRequest.userId = user._id
    subtitleRequest.episodeId = episodeDetails.id
    subtitleRequest.comment = subtitleRequest.comment?.trim() || null

    const insertedSubtitleRequest = await SubtitleRequest.create(
      subtitleRequest
    )

    res.status(201).json(insertedSubtitleRequest)
  }
)

// @desc get all subtitle requests for a specific episode
// @route GET /subtitles/requests/:episodeId
// @access Public
const getSubtitleRequestsForEpisode = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id
    const episodeId = Number(req.params.episodeId)

    if (!episodeId) throw new CustomError('Invalid parameter', 400)

    const subtitleRequests = await SubtitleRequest.aggregate([
      {
        $match: { episodeId },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'subtitles',
          localField: 'subtitleId',
          foreignField: '_id',
          as: 'subtitle',
        },
      },
      {
        $unwind: {
          path: '$subtitle',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'subtitle.userId',
          foreignField: '_id',
          as: 'subtitle.user',
        },
      },
      {
        $unwind: {
          path: '$subtitle.user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'user.email': 0,
          'user.password': 0,
          'user.isAdmin': 0,
          'user.updatedAt': 0,
          'subtitle.user.email': 0,
          'subtitle.user.password': 0,
          'subtitle.user.isAdmin': 0,
          'subtitle.user.updatedAt': 0,
          'subtitle.updatedAt': 0,
          'subtitle.createdAt': 0,
          'subtitle.tvShowId': 0,
          'subtitle.season': 0,
          'subtitle.episode': 0,
          'subtitle.episodeId': 0,
          'subtitle.language': 0,
          'subtitle.frameRate': 0,
          'subtitle.onlyForeignLanguage': 0,
          'subtitle.release': 0,
          'subtitle.downloads': 0,
          'subtitle.thankedBy': 0,
          'subtitle.subtitleRequestId': 0,
          'subtitle.forHearingImpaired': 0,
        },
      },
      {
        $addFields: {
          isOwner: {
            $eq: ['$userId', userId],
          },
          subtitle: {
            $cond: {
              if: { $eq: ['$subtitle', {}] },
              then: null,
              else: '$subtitle',
            },
          },
        },
      },
      {
        $sort: {
          isOwner: -1,
          updatedAt: -1,
        },
      },
    ])

    res.json(subtitleRequests)
  }
)

// @desc reopen a subtitle request
// @route PATCH /subtitles/requests/reopen/:requestId
// @access Private
const reopenSubtitleRequest = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const requestId = req.params.requestId

    const subtitleRequest = await SubtitleRequest.findById(requestId)

    if (!subtitleRequest)
      throw new CustomError('Subtitle request not found', 404)

    if (!subtitleRequest.userId.equals(userId))
      throw new CustomError('Not authorized', 403)

    if (!subtitleRequest.subtitleId)
      throw new CustomError("Can't reopen an already opened request", 409)

    const relatedSubtitle = await Subtitle.findById(subtitleRequest.subtitleId)
    if (relatedSubtitle) {
      relatedSubtitle.subtitleRequestId = null
      await relatedSubtitle.save()
    }
    subtitleRequest.subtitleId = null
    await subtitleRequest.save()

    res.json('Reopened subtitle request')
  }
)

// @desc delete a subtitle request
// @route DELETE /subtitles/requests/:requestId
// @access Private
const deleteSubtitleRequest = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const isAdmin = req.user?.isAdmin as boolean
    const requestId = req.params.requestId

    const subtitleRequest = await SubtitleRequest.findById(requestId)

    if (!subtitleRequest)
      throw new CustomError('Subtitle request not found', 404)

    if (!subtitleRequest.userId.equals(userId) && !isAdmin)
      throw new CustomError('Not authorized', 403)

    if (subtitleRequest.subtitleId) {
      const relatedSubtitle = await Subtitle.findById(
        subtitleRequest.subtitleId
      )
      if (relatedSubtitle) {
        relatedSubtitle.subtitleRequestId = null
        await relatedSubtitle.save()
      }
    }

    await subtitleRequest.deleteOne()

    res.json('Removed subtitle request')
  }
)

export {
  addSubtitleRequest,
  getSubtitleRequestsForEpisode,
  deleteSubtitleRequest,
  addSubtitle,
  downloadSubtitle,
  getSubtitlesForEpisode,
  deleteSubtitle,
  thankSubtitleUploader,
  confirmSubtitle,
  updateSubtitle,
  reopenSubtitleRequest,
  reportSubtitle,
  fulfillRequestWithExistingSubtitle,
  getUserSubtitlesForEpisode,
  rejectSubtitleReport,
  approveSubtitleReport,
  getPendingSubtitleReports,
  getApprovedSubtitleReports,
  getRejectedSubtitleReports,
  getSubtitlesByUser,
  getAllSubtitles,
}
