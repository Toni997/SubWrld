import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { validateSubtitleRequest } from '../middleware/bodyMiddleware'
import SubtitleRequest, {
  ICreateSubtitleRequest,
  ISubtitleRequest,
} from '../models/subtitleRequest'
import { IUser } from '../models/user'
import { IAuthUserRequest } from '../interfaces/request'
import axios from 'axios'
import {
  getTVShowEpisodeDetailsUrl,
  getTVShowSeasonDetailsUrl,
} from '../utils/tmdb-api'
import { ITVShowEpisode } from '../interfaces/tv-shows'
import mongoose from 'mongoose'
import Subtitle, { ICreateSubtitle } from '../models/subtitle'
import { v4 as uuidv4 } from 'uuid'
import archiver from 'archiver'
import fs from 'fs'

const addSubtitle = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    if (!req.file) {
      res.status(400)
      throw new Error('File not supported')
    }
    const user = req.user as IUser
    const subtitle: ICreateSubtitle = req.body
    const files = req.files

    try {
      const response = await axios.get(
        getTVShowEpisodeDetailsUrl(
          subtitle.tvShowId,
          subtitle.season,
          subtitle.episode
        )
      )
      const episodeDetails: ITVShowEpisode = response.data

      subtitle.userId = user._id
      subtitle.episodeId = episodeDetails.id
      subtitle.release = subtitle.release.trim()

      /*const zipFileName = uuidv4()
      const output = fs.createWriteStream(zipFileName + '.zip')

      const archive = archiver('zip', {
        zlib: { level: 9 }, // Set compression level (optional)
      });
    
      // Pipe the archive stream to the output stream
      archive.pipe(output);

      const insertedSubtitleRequest = await Subtitle.create(subtitle)*/

      res.status(201).json(subtitle)
    } catch (error: any) {
      res.status(error.response?.status || 500)
      throw new Error(error.message || 'Error with TMBD API')
    }
  }
)

const addSubtitleRequest = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user as IUser
    const subtitleRequest: ICreateSubtitleRequest = req.body

    try {
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
    } catch (error: any) {
      res.status(error.response?.status || 500)
      throw new Error(error.message || 'Error with TMBD API')
    }
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

    const subtitleRequest = await SubtitleRequest.findOne({ _id: requestId })

    if (!subtitleRequest) {
      res.status(404)
      throw new Error('Subtitle request not found')
    }

    if (subtitleRequest.userId !== userId && !isAdmin) {
      res.status(401)
      throw new Error('Not authorized')
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
}
