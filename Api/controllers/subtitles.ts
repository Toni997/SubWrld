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
import Subtitle, { ICreateSubtitle, IUpsertSubtitle } from '../models/subtitle'
import { v4 as uuidv4 } from 'uuid'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { subtitlesFolderPath, tempFolderPath } from '../config/multer'
import { CustomError } from '../middleware/errorMiddleware'

const addSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user as IUser
    const subtitle: IUpsertSubtitle = req.body
    const files = req.files as Express.Multer.File[] | undefined

    if (subtitle.subtitleRequestId) {
      const foundRequest = await SubtitleRequest.findById(
        subtitle.subtitleRequestId
      )
      if (!foundRequest)
        throw new CustomError('Subtitle request not found', 404)
    }

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
      forHearingImpaired: Boolean(subtitle.forHearingImpaired),
      isWorkInProgress: Boolean(subtitle.isWorkInProgress),
      onlyForeignLanguage: Boolean(subtitle.onlyForeignLanguage),
      uploaderIsAuthor: Boolean(subtitle.uploaderIsAuthor),
      release: subtitle.release.replace(/\s+/g, ' '),
      subtitleRequestId: subtitle.subtitleRequestId
        ? new mongoose.Types.ObjectId(subtitle.subtitleRequestId)
        : null,
      filePath: null,
    }

    if (files) {
      const zipFileName = uuidv4() + '.zip'
      const zipFilePath = path.join(subtitlesFolderPath, zipFileName)
      subtitleToInsert.filePath = zipFileName

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
    }

    const insertedSubtitle = await Subtitle.create(subtitleToInsert)

    res.status(201).json(insertedSubtitle)
    console.log('hey')
    if (!files) return
    for (const file of files) {
      const filePath = path.join(tempFolderPath, file.filename)
      fs.unlinkSync(filePath)
    }
  }
)

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
  const lang = subtitle.language
  const extension = 'zip'

  const fullDownloadFileName = `${tvShowName}.${seasonAndEpisode}.${subtitle.release}.${lang}.${extension}`
  const filePath = path.join(subtitlesFolderPath, subtitle.filePath)

  res.download(filePath, fullDownloadFileName, err => {
    if (err) throw new Error('Error downloading file')
  })
})

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

const getSubtitleRequestsForEpisode = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id
    const episodeId = Number(req.params.episodeId)

    if (!episodeId) {
      res.status(400)
      throw new Error('Invalid parameter')
    }

    const subtitleRequests = await SubtitleRequest.aggregate([
      {
        $match: { episodeId }, // Replace epsidoeid with the specific episodeId
      },
      {
        $lookup: {
          from: 'users', // Replace 'users' with the actual collection name for users
          localField: 'userId',

          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          'user.email': 0,
          'user.password': 0,
          'user.isAdmin': 0,
          'user.updatedAt': 0,
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
          createdAt: -1,
        },
      },
    ])

    res.json(subtitleRequests)
  }
)

const deleteSubtitleRequest = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const isAdmin = req.user?.isAdmin as boolean
    const requestId = req.params.requestId

    const subtitleRequest = await SubtitleRequest.findById(requestId)

    if (!subtitleRequest) {
      throw new CustomError('Subtitle request not found', 404)
    }

    if (subtitleRequest.userId.toString() !== userId.toString() && !isAdmin) {
      throw new CustomError('Not authorized', 401)
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
}
