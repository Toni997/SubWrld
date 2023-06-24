import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import axios from 'axios'
import {
  genresUrl,
  getSearchTVShowUrl,
  popularTVShowsUrl,
  getTVShowDetailsUrl,
  getTVShowSeasonDetailsUrl,
} from '../utils/tmdb-api'
import {
  ITVShowDetails,
  ITVShowEpisode,
  ITVShowSeason,
} from '../interfaces/tv-shows'
import { IAuthUserRequest } from '../interfaces/request'
import WatchedEpisode, { IWatchedEpisode } from '../models/watchedEpisodes'
import { checkWatchlisted } from './user'
import Watchlist from '../models/watchlist'

const limitNumberOfResults = 10

const addGenreNamesToShowsArray = async (showsArray: []) => {
  const genresResponse = await axios.get(genresUrl)
  const genres = genresResponse.data.genres
  const genresObject = genres.reduce(
    (a: { [key: string]: any }, v: { [key: string]: any }) => ({
      ...a,
      [v.id]: v.name,
    }),
    {}
  )

  showsArray.forEach((show: any) => {
    const genreNames = show.genre_ids.map((id: number) => genresObject[id])
    show.genre_names = genreNames
  })
}

// @desc Search TV Shows that include keyword
// @route GET /tv-shows/search?keword=<keyword>
// @access Public
const searchTVShows = asyncHandler(async (req: Request, res: Response) => {
  const keyword = req.query.keyword?.toString()
  if (!keyword || keyword.trim().length < 1) {
    throw new Error('Search keyword should be at least 1 character long')
  }

  try {
    const response = await axios.get(getSearchTVShowUrl(keyword))

    let shows: [] = response.data.results
    shows = shows.slice(0, limitNumberOfResults) as []
    await addGenreNamesToShowsArray(shows)

    res.json(shows)
  } catch (error: any) {
    throw new Error(error.message || 'Error with TMBD API')
  }
})

// @desc Get popular TV shows
// @route GET /tv-shows/popular
// @access Public
const popularTVShows = asyncHandler(async (req: Request, res: Response) => {
  try {
    const response = await axios.get(popularTVShowsUrl)

    let shows: [] = response.data.results
    shows = shows.slice(0, limitNumberOfResults) as []
    await addGenreNamesToShowsArray(shows)

    res.json(shows)
  } catch (error: any) {
    throw new Error(error.message || 'Error with TMBD API')
  }
})

// @desc Get TV show details
// @route GET /tv-shows/:tvShowId
// @access Public
const getTVShowDetails = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user
    const { tvShowId } = req.params
    try {
      const response = await axios.get(getTVShowDetailsUrl(tvShowId))
      const tvShow: ITVShowDetails = response.data

      if (!user) {
        res.json(tvShow)
        return
      }

      const watchlisted = await Watchlist.findOne({
        userId: user._id,
        tvShowId,
      })

      tvShow.is_watchlisted_by_user = !!watchlisted
      res.json(tvShow)
    } catch (error: any) {
      throw new Error(error.message || 'Error with TMBD API')
    }
  }
)

// @desc Get TV show season details
// @route GET /tv-shows/:tvShowId/season/:season
// @access Public
const getTVShowSeasonDetails = asyncHandler(
  async (req: IAuthUserRequest, res: Response) => {
    const user = req.user
    const { tvShowId, season } = req.params
    try {
      const response = await axios.get(
        getTVShowSeasonDetailsUrl(tvShowId, season)
      )
      const seasonsDetails: ITVShowSeason = response.data
      if (!user) {
        res.json(seasonsDetails.episodes)
        return
      }
      const watchedEpisodesByUser = await WatchedEpisode.find({
        userId: user._id,
        tvShowId,
      })
      for (const episode of seasonsDetails.episodes) {
        const isMarkedAsWatched = !!watchedEpisodesByUser.find(
          w => w.episodeId === episode.id
        )
        episode.marked_as_watched = isMarkedAsWatched
      }
      res.json(seasonsDetails.episodes)
    } catch (error: any) {
      throw new Error(error.message || 'Error with TMBD API')
    }
  }
)

export {
  searchTVShows,
  popularTVShows,
  getTVShowDetails,
  getTVShowSeasonDetails,
}
