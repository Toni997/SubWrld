import { Request, Response } from 'express'
import { markWatchedValidator } from './validators/watchedEpisodesValidator'

const validateMarkWatched = (req: Request, res: Response, next: () => void) => {
  const { error } = markWatchedValidator.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  next()
}

export { validateMarkWatched }
