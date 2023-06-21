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

const limitNumberOfResults = 10

const addGenreNamesToShowsArray = async (showsArray: []) => {
  const genresResponse: any = await axios.get(genresUrl)
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
// @route GET /tv-shows/search?keword=
// @access Public
const searchTVShows = asyncHandler(async (req: Request, res: Response) => {
  const keyword = req.query.keyword?.toString()
  if (!keyword || keyword.trim().length < 1) {
    throw new Error('Search keyword should be at least 1 character long')
  }

  try {
    const url = getSearchTVShowUrl(keyword)
    const showsResponse: any = await axios.get(url)
    let shows: [] = showsResponse.data.results

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
    const showsResponse: any = await axios.get(popularTVShowsUrl)
    let shows: [] = showsResponse.data.results
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
const getTVShowDetails = asyncHandler(async (req: Request, res: Response) => {
  const { tvShowId } = req.params
  try {
    const response: any = await axios.get(getTVShowDetailsUrl(tvShowId))
    const tvShow: ITVShowDetails = response.data
    for (const season of tvShow.seasons) {
      const response: any = await axios.get(
        getTVShowSeasonDetailsUrl(tvShowId, season.season_number)
      )
      const tvShowSeason: ITVShowSeason = response.data
      season.episodes = tvShowSeason.episodes
    }
    res.json(tvShow)
  } catch (error: any) {
    throw new Error(error.message || 'Error with TMBD API')
  }
})

export { searchTVShows, popularTVShows, getTVShowDetails }
