import { Request, Response } from 'express'
import { markWatchedValidator } from './validators/watchedEpisodesValidator'
import { removeFromWatchlistValidator } from './validators/watchlistValidator'
import { subtitleRequestValidator } from './validators/subtitleRequestValidator'
import { setDarkModeValidator } from './validators/setDarkModeValidator'
import { subtitleValidator } from './validators/subtitleValidator'

const validateMarkWatched = (req: Request, res: Response, next: () => void) => {
  const { error } = markWatchedValidator.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  next()
}

const validateRemoveFromWatchlist = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { error } = removeFromWatchlistValidator.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  next()
}

const validateSubtitleRequest = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { error } = subtitleRequestValidator.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  next()
}

const validateSetDarkMode = (req: Request, res: Response, next: () => void) => {
  const { error } = setDarkModeValidator.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  next()
}

export {
  validateMarkWatched,
  validateRemoveFromWatchlist,
  validateSubtitleRequest,
  validateSetDarkMode,
}
