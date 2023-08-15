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
  getUsersOrderedByReputation,
} from '../controllers/users'
import { authenticate } from '../middleware/authMiddleware'
import { validateBody } from '../middleware/bodyMiddleware'
import { markWatchedValidator } from '../middleware/validators/watchedEpisodesValidator'
import { removeFromWatchlistValidator } from '../middleware/validators/watchlistValidator'
import { setDarkModeValidator } from '../middleware/validators/setDarkModeValidator'

const usersRouter = express.Router()

usersRouter.post('/login', loginUser)
usersRouter.post('/signup', signupUser)
usersRouter.patch(
  '/set-dark-mode',
  authenticate,
  validateBody(setDarkModeValidator),
  setDarkMode
)
usersRouter.get('/watchlisted/:tvShowId', authenticate, checkWatchlisted)
usersRouter.post('/watchlist/:tvShowId', authenticate, addToWatchlist)
usersRouter.delete(
  '/watchlist/',
  authenticate,
  validateBody(removeFromWatchlistValidator),
  removeFromWatchlist
)
usersRouter.get('/watchlist', authenticate, getWatchlist)
usersRouter.get('/watched/:episodeId', authenticate, checkEpisodeWatched)
usersRouter.post(
  '/mark-watched',
  authenticate,
  validateBody(markWatchedValidator),
  markEpisodeWatched
)
usersRouter.delete(
  '/mark-unwatched/:episodeId',
  authenticate,
  removeEpisodeFromWatched
)
usersRouter.get('/by-reputation', getUsersOrderedByReputation)
usersRouter.get('/:userId', getUser)
usersRouter.put('/', authenticate, updateUser)

export default usersRouter
