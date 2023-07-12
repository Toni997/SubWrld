import express, { Router } from 'express'
import {
  authenticate,
  passUserToRequest,
  requireAdminRights,
} from '../middleware/authMiddleware'
import {
  addSubtitleRequest,
  getSubtitleRequestsForEpisode,
  deleteSubtitleRequest,
  addSubtitle,
  downloadSubtitle,
  deleteSubtitle,
  getSubtitlesForEpisode,
  thankSubtitleUploader,
  confirmSubtitle,
  updateSubtitle,
} from '../controllers/subtitles'
import { validateSubtitleRequest } from '../middleware/bodyMiddleware'
import { createSubtitleMulter, updateSubtitleMulter } from '../config/multer'
import onlyMultipartDataAllowed from '../middleware/onlyMultipartDataAllowed'

const subtitleRouter: Router = express.Router()

subtitleRouter.post(
  '',
  authenticate,
  onlyMultipartDataAllowed,
  createSubtitleMulter.array('files', 5),
  addSubtitle
)

subtitleRouter.put(
  '/:subtitleId',
  authenticate,
  onlyMultipartDataAllowed,
  updateSubtitleMulter.array('files', 5),
  updateSubtitle
)

subtitleRouter.get('/download/:subtitleId', downloadSubtitle)

subtitleRouter.post('/thanks/:subtitleId', authenticate, thankSubtitleUploader)

subtitleRouter.patch(
  '/confirm/:subtitleId',
  requireAdminRights,
  confirmSubtitle
)

subtitleRouter.get('/:episodeId', passUserToRequest, getSubtitlesForEpisode)

subtitleRouter.delete('/:subtitleId', authenticate, deleteSubtitle)

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
