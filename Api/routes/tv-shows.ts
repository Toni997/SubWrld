import express, { Router } from 'express'
import {
  popularTVShows,
  searchTVShows,
  getTVShowDetails,
  getTVShowSeasonDetails,
} from '../controllers/tv-shows'
import { passUserToRequest } from '../middleware/authMiddleware'

const tvShowRouter: Router = express.Router()

tvShowRouter.get('/search', searchTVShows)
tvShowRouter.get('/popular', popularTVShows)
tvShowRouter.get(
  '/:tvShowId/season/:season',
  passUserToRequest,
  getTVShowSeasonDetails
)
tvShowRouter.get('/:tvShowId', passUserToRequest, getTVShowDetails)

export default tvShowRouter
