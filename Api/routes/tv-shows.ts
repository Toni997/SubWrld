import express, { Router } from 'express'
import { popularTVShows, searchTVShows } from '../controllers/tv-shows'

const searchRouter: Router = express.Router()

searchRouter.get('/search', searchTVShows)
searchRouter.get('/popular', popularTVShows)

export default searchRouter
