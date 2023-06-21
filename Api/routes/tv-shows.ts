import express, { Router } from 'express'
import {
  popularTVShows,
  searchTVShows,
  getTVShowDetails,
} from '../controllers/tv-shows'

const searchRouter: Router = express.Router()

searchRouter.get('/search', searchTVShows)
searchRouter.get('/popular', popularTVShows)
searchRouter.get('/:tvShowId', getTVShowDetails)

export default searchRouter
