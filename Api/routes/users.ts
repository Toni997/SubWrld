import express, { Router } from 'express'
import {
  loginUser,
  signupUser,
  getUser,
  updateUser,
  getWatchlist,
  checkWatchlisted,
  addToWatchlist,
  removeFromWatchlist,
  removeEpisodeFromWatched,
  markEpisodeWatched,
  checkEpisodeWatched,
  setDarkMode,
} from '../controllers/users'
import { authenticate } from '../middleware/authMiddleware'
import {
  validateMarkWatched,
  validateRemoveFromWatchlist,
  validateSetDarkMode,
} from '../middleware/bodyMiddleware'

const usersRouter: Router = express.Router()

usersRouter.post('/login', loginUser)
usersRouter.post('/signup', signupUser)
usersRouter.patch(
  '/set-dark-mode',
  authenticate,
  validateSetDarkMode,
  setDarkMode
)
usersRouter.get('/watchlisted/:tvShowId', authenticate, checkWatchlisted)
usersRouter.post('/watchlist/:tvShowId', authenticate, addToWatchlist)
usersRouter.delete(
  '/watchlist/',
  authenticate,
  validateRemoveFromWatchlist,
  removeFromWatchlist
)
usersRouter.get('/watchlist', authenticate, getWatchlist)
usersRouter.get('/watched/:episodeId', authenticate, checkEpisodeWatched)
usersRouter.post(
  '/mark-watched',
  authenticate,
  validateMarkWatched,
  markEpisodeWatched
)
usersRouter.delete(
  '/mark-unwatched/:episodeId',
  authenticate,
  removeEpisodeFromWatched
)
usersRouter.get('/:userId', getUser)
usersRouter.put('/', authenticate, updateUser)

export default usersRouter
