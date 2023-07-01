import asyncHandler from 'express-async-handler'
import generateToken from '../utils/generateToken'
import { Request, Response } from 'express'
import { IAuthUserRequest, IUpdateUserRequest } from '../interfaces/request'
import User, { IUser } from '../models/user'
import Watchlist, { IWatchlistWithTVShowDetails } from '../models/watchlist'
import mongoose from 'mongoose'
import axios from 'axios'
import {
  getTVShowDetailsUrl,
  getTVShowEpisodeDetailsUrl,
  getTVShowSeasonDetailsUrl,
} from '../utils/tmdb-api'
import {
  IMarkWatched,
  ITVShowDetails,
  ITVShowEpisode,
  ITVShowSeason,
  IUpdateWatchedEpisodes,
} from '../interfaces/tv-shows'

import { markWatchedEpisodesValidator } from '../middleware/validators/watchedEpisodesValidator'
import WatchedEpisode, {
  IUpdateWatchedEpisode,
  IWatchedEpisode,
} from '../models/watchedEpisodes'
import { CustomError } from '../middleware/errorMiddleware'

// @desc Auth user & get token
// @route POST /users/login
// @access Public
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      darkMode: user.darkMode,
      token: generateToken(user),
    })
  } else {
    throw new CustomError('Invalid email or password', 401)
  }
})

// @desc Register a new user
// @route POST /users
// @access Public
const signupUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body

  const usernameExists = await User.findOne({ username })

  if (usernameExists) throw new CustomError('Username already exists', 400)

  const emailExists = await User.findOne({ email })

  if (emailExists) throw new CustomError('Email already exists', 400)

  const user = await User.create({
    username,
    email,
    password,
  })

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user),
    })
  } else {
    throw new CustomError('Invalid user data', 400)
  }
})

// @desc Update user
// @route PUT /users
// @access Private
const updateUser = asyncHandler(
  async (req: IUpdateUserRequest, res: Response) => {
    const user = await User.findById(req.user?._id)

    if (user) {
      user.username = req.body.name || user.username
      user.email = req.body.email || user.email
      if (req.body.password) {
        user.password = req.body.password
      }

      const updatedUser = await user.save()

      res.json({
        _id: updatedUser._id,
        name: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser),
      })
    } else {
      throw new CustomError('User not found', 404)
    }
  }
)

// @desc Get user
// @route GET /users/:userId
// @access Public
const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.userId).select(
    '-password -watchlist'
  )

  if (user) {
    res.json(user)
  } else {
    throw new CustomError('User not found', 404)
  }
})

// @desc Get user watchlist
// @route GET /users/watchlist
// @access Private
const getWatchlist = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const watchlist: IWatchlistWithTVShowDetails[] = await Watchlist.find({
      userId: req.user?._id,
    }).lean()

    for (const item of watchlist) {
      const response = await axios.get(getTVShowDetailsUrl(item.tvShowId))
      const tvShow: ITVShowDetails = response.data
      item.title = tvShow.name
      item.next_episode_to_air = tvShow.next_episode_to_air
      item.status = tvShow.status
    }

    res.json(watchlist)
  }
)

// @desc check if user has watchlisted a tv show
// @route GET /users/watchlisted/:tvShowId
// @access Private
const checkWatchlisted = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const watchlisted = await Watchlist.findOne({
      userId: req.user?._id,
      tvShowId: req.params.tvShowId,
    })
    res.json(!!watchlisted)
  }
)

// @desc add tv show to watchlist
// @route POST /users/watchlist/:tvShowId
// @access Private
const addToWatchlist = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user?._id)
    const tvShowId = Number(req.params.tvShowId)

    const watchlisted = await Watchlist.findOne({
      userId,
      tvShowId,
    })

    await axios.get(getTVShowDetailsUrl(tvShowId))

    if (watchlisted)
      throw new CustomError('You have already watchlisted this show', 422)

    const insertedWatchlist = await Watchlist.create({
      userId,
      tvShowId,
    })

    res.status(201).json(insertedWatchlist)
  }
)

// @desc remove tv show from watchlist
// @route DELETE /api/users/watchlist/:tvShowId
// @access Private
const removeFromWatchlist = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id as mongoose.Types.ObjectId
    const { tvShowIds }: { tvShowIds: number[] } = req.body
    const watchlistedToInsert: number[] = []

    for (const tvShowId of tvShowIds) {
      const watchlisted = await Watchlist.findOne({
        userId,
        tvShowId,
      })

      if (watchlisted) {
        watchlistedToInsert.push(tvShowId)
      }
    }

    if (watchlistedToInsert.length)
      await Watchlist.deleteMany({
        userId,
        tvShowId: { $in: watchlistedToInsert },
      })

    res.json(
      `Removed ${watchlistedToInsert.length} TV shows from your watchlist`
    )
  }
)

// @desc check if user has marked episode as watched
// @route GET /api/users/watched/:episodeId
// @access Private
const checkEpisodeWatched = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const watchedEpisode = await WatchedEpisode.findOne({
      userId: req.user?._id,
      episodeId: req.params.episodeId,
    })
    res.json(!!watchedEpisode)
  }
)

const fetchSeasonEpisodes = async (
  tvShowId: number,
  season: number
): Promise<ITVShowEpisode[]> => {
  const response = await axios.get(getTVShowSeasonDetailsUrl(tvShowId, season))
  const seasonDetails: ITVShowSeason = response.data
  return seasonDetails.episodes
}

const handleMarkWatched = async (
  userId: mongoose.Types.ObjectId,
  tvShowId: number,
  watched: IUpdateWatchedEpisodes,
  alreadyWatchedEpisodes: IWatchedEpisode[],
  watchedEpisodesToInsert: IUpdateWatchedEpisode[]
) => {
  const season = watched.season
  const episodes = watched.episodes

  const { error } = markWatchedEpisodesValidator.validate(watched)
  if (error) throw new CustomError(error.details[0].message, 400)

  if (episodes === null) {
    const seasonEpisodes = await fetchSeasonEpisodes(tvShowId, season)
    for (const episodeDetails of seasonEpisodes) {
      const alreadyExists = alreadyWatchedEpisodes.find(
        w => w.episode === episodeDetails.episode_number
      )
      if (!alreadyExists) {
        watchedEpisodesToInsert.push({
          userId,
          tvShowId,
          season,
          episode: episodeDetails.episode_number,
          episodeId: episodeDetails.id,
        })
      }
    }
  } else if (Array.isArray(episodes)) {
    const from: number = episodes[0]
    const to: number = episodes[1]
    const seasonEpisodes = await fetchSeasonEpisodes(tvShowId, season)

    for (const episodeDetails of seasonEpisodes) {
      const episodeNumber = episodeDetails.episode_number
      const shouldInsert =
        episodeNumber >= from &&
        episodeNumber <= to &&
        !alreadyWatchedEpisodes.find(
          w => w.episode === episodeDetails.episode_number
        )

      if (shouldInsert) {
        watchedEpisodesToInsert.push({
          userId,
          tvShowId,
          season,
          episode: episodeDetails.episode_number,
          episodeId: episodeDetails.id,
        })
      }
    }
  } else {
    const { data: seasonDetails } = await axios.get(
      getTVShowEpisodeDetailsUrl(tvShowId, season, episodes)
    )
    const alreadyExists = !!alreadyWatchedEpisodes.find(
      w => w.episode === seasonDetails.episode_number
    )
    if (!alreadyExists) {
      watchedEpisodesToInsert.push({
        userId,
        tvShowId,
        season,
        episode: seasonDetails.episode_number,
        episodeId: seasonDetails.id,
      })
    }
  }
}

// @desc mark episode as watched
// @route POST /users/mark-watched
// @access Private
const markEpisodeWatched = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user?._id)
    const markWatched: IMarkWatched = req.body
    const watchedEpisodesToInsert: IUpdateWatchedEpisode[] = []

    await axios.get(getTVShowDetailsUrl(markWatched.tvShowId))

    const alreadyWatchedEpisodes = await WatchedEpisode.find({
      userId,
      tvShowId: markWatched.tvShowId,
    })

    for (const watched of markWatched.watched) {
      const alreadyWatchedEpisodesInASeason = alreadyWatchedEpisodes.filter(
        w => w.season === watched.season
      ) as IWatchedEpisode[]

      await handleMarkWatched(
        userId,
        markWatched.tvShowId,
        watched,
        alreadyWatchedEpisodesInASeason,
        watchedEpisodesToInsert
      )
    }

    if (watchedEpisodesToInsert.length) {
      await WatchedEpisode.insertMany(watchedEpisodesToInsert)
      res
        .status(201)
        .json(`Added ${watchedEpisodesToInsert.length} watched episodes`)
    } else {
      res.status(200).json('All episodes have already been marked as watched')
    }
  }
)

// @desc remove episode from watched
// @route DELETE /users/watched/:episodeId
// @access Private
const removeEpisodeFromWatched = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const userId = req.user?._id
    const episodeId = Number(req.params.episodeId)

    const watchedEpisode = await WatchedEpisode.findOne({
      userId,
      episodeId,
    })

    if (!watchedEpisode)
      throw new CustomError(
        "You haven't marked this episode as watched yet",
        422
      )

    await watchedEpisode.deleteOne()

    res.json('Removed from watched episodes')
  }
)

// @desc set dark mode
// @route PATCH /users/set-dark-mode
// @access Private
const setDarkMode = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const { darkMode } = req.body
    const authenticatedUser = req.user as IUser

    await User.updateOne({ _id: authenticatedUser._id }, { darkMode })

    res.json('Success')
  }
)

export {
  loginUser,
  signupUser,
  getUser,
  updateUser,
  getWatchlist,
  checkWatchlisted,
  addToWatchlist,
  removeFromWatchlist,
  checkEpisodeWatched,
  removeEpisodeFromWatched,
  markEpisodeWatched,
  setDarkMode,
}
