import express, { Router } from 'express'
import { authenticate, passUserToRequest } from '../middleware/authMiddleware'
import {
  addSubtitleRequest,
  getSubtitleRequestsForEpisode,
  deleteSubtitleRequest,
  addSubtitle,
  downloadSubtitle,
} from '../controllers/subtitles'
import { validateSubtitleRequest } from '../middleware/bodyMiddleware'
import { upload } from '../config/multer'

const subtitleRouter: Router = express.Router()

subtitleRouter.post('', authenticate, upload.array('subtitles', 5), addSubtitle)
subtitleRouter.get('/download/:subtitleId', downloadSubtitle)

subtitleRouter.post(
  '/requests',
  authenticate,
  validateSubtitleRequest,
  addSubtitleRequest
)

subtitleRouter.get(
  '/requests/:episodeId',
  passUserToRequest,
  getSubtitleRequestsForEpisode
)

subtitleRouter.delete(
  '/requests/:requestId',
  authenticate,
  deleteSubtitleRequest
)

export default subtitleRouter
