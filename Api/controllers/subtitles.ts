import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import SubtitleRequest, {
  ICreateSubtitleRequest,
} from '../models/subtitleRequest'
import { IUser } from '../models/user'
import { IAuthUserRequest } from '../interfaces/request'
import axios from 'axios'
import {
  getTVShowDetailsUrl,
  getTVShowEpisodeDetailsUrl,
} from '../utils/tmdb-api'
import { ITVShowDetails, ITVShowEpisode } from '../interfaces/tv-shows'
import mongoose from 'mongoose'
import Subtitle, {
  ICreateSubtitle,
  ICreateSubtitleForm,
  IUpdateSubtitleForm,
} from '../models/subtitle'
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
        $match: { episodeId }, // Replace epsidoeid with the specific episodeId
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
    subtitleRequest = subtitleRequest!

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
    subtitleRequest.subtitleId = insertedSubtitle._id
    subtitleRequest.save()

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

    if (
      user._id.toString() !== subtitleToUpdate.userId.toString() &&
      !user.isAdmin
    )
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

    if (subtitle.userId.toString() !== userId.toString() && !isAdmin)
      throw new CustomError('Not authorized', 401)

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
    if (err) throw new Error('Error downloading file')
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

    if (subtitle.userId.toString() === userId.toString())
      throw new CustomError("You can't thank for a subtitle you uploaded", 409)

    if (subtitle.thankedBy.includes(userId))
      throw new CustomError('Already thanked for this subtitle', 409)

    subtitle.thankedBy.push(userId)
    await subtitle.save()

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

    res.json('Success')
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
        $match: { episodeId }, // Replace epsidoeid with the specific episodeId
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
        $project: {
          'user.email': 0,
          'user.password': 0,
          'user.isAdmin': 0,
          'user.updatedAt': 0,
          'subtitle.user.email': 0,
          'subtitle.user.password': 0,
          'subtitle.user.isAdmin': 0,
          'subtitle.user.updatedAt': 0,
        },
      },
      {
        $addFields: {
          isOwner: {
            $eq: ['$userId', userId], // Create a new field isOwner to check if userId matches user._id
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

    if (subtitleRequest.userId.toString() !== userId.toString() && !isAdmin)
      throw new CustomError('Not authorized', 401)

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
}
