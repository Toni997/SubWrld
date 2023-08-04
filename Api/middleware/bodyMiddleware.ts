import { Request, Response } from 'express'
import { markWatchedValidator } from './validators/watchedEpisodesValidator'
import { removeFromWatchlistValidator } from './validators/watchlistValidator'
import { subtitleRequestValidator } from './validators/subtitleRequestValidator'
import { setDarkModeValidator } from './validators/setDarkModeValidator'
import { CustomError } from './errorMiddleware'
import { subtitleReportValidator } from './validators/subtitleReportValidator'
import Joi from 'joi'

const validateMarkWatched = (req: Request, res: Response, next: () => void) => {
  const { error } = markWatchedValidator.validate(req.body)
  if (error) throw new CustomError(error.details[0].message, 400)
  next()
}

const validateRemoveFromWatchlist = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { error } = removeFromWatchlistValidator.validate(req.body)
  if (error) throw new CustomError(error.details[0].message, 400)
  next()
}

const validateSubtitleRequest = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { error } = subtitleRequestValidator.validate(req.body)
  if (error) throw new CustomError(error.details[0].message, 400)
  next()
}

const validateSetDarkMode = (req: Request, res: Response, next: () => void) => {
  const { error } = setDarkModeValidator.validate(req.body)
  if (error) throw new CustomError(error.details[0].message, 400)
  next()
}

const validateSubtitleReport = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const { error } = subtitleReportValidator.validate(req.body)
  if (error) throw new CustomError(error.details[0].message, 400)
  next()
}

const validateBody =
  (validator: Joi.ObjectSchema<any>) =>
  (req: Request, res: Response, next: () => void) => {
    const { error } = validator.validate(req.body)
    if (error) throw new CustomError(error.details[0].message, 400)
    next()
  }

export { validateBody }
