import express, { Router } from 'express'
import {
  popularTVShows,
  searchTVShows,
  getTVShowDetails,
  getTVShowSeasonDetails,
} from '../controllers/tv-shows'
import { passUserToRequest } from '../middleware/authMiddleware'

const searchRouter: Router = express.Router()

searchRouter.get('/search', searchTVShows)
searchRouter.get('/popular', popularTVShows)
searchRouter.get(
  '/:tvShowId/season/:season',
  passUserToRequest,
  getTVShowSeasonDetails
)
searchRouter.get('/:tvShowId', passUserToRequest, getTVShowDetails)

export default searchRouter
