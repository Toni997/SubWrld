import express from 'express'
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
  reopenSubtitleRequest,
  reportSubtitle,
  fulfillRequestWithExistingSubtitle,
  getUserSubtitlesForEpisode,
  getPendingSubtitleReports,
  getApprovedSubtitleReports,
  getRejectedSubtitleReports,
  approveSubtitleReport,
  rejectSubtitleReport,
  getSubtitlesByUser,
  getAllSubtitles,
} from '../controllers/subtitles'
import { validateBody } from '../middleware/bodyMiddleware'
import { subtitleMulter } from '../config/multer'
import onlyMultipartDataAllowed from '../middleware/onlyMultipartDataAllowed'
import { subtitleRequestValidator } from '../middleware/validators/subtitleRequestValidator'
import { subtitleReportValidator } from '../middleware/validators/subtitleReportValidator'
import {
  createSubtitleValidator,
  updateSubtitleValidator,
} from '../middleware/validators/subtitleValidator'

const subtitleRouter = express.Router()

subtitleRouter.get('', getAllSubtitles)

subtitleRouter.post(
  '',
  authenticate,
  onlyMultipartDataAllowed,
  subtitleMulter.array('files', 5),
  validateBody(createSubtitleValidator),
  addSubtitle
)

subtitleRouter.put(
  '/:subtitleId',
  authenticate,
  onlyMultipartDataAllowed,
  subtitleMulter.array('files', 5),
  validateBody(updateSubtitleValidator),
  updateSubtitle
)

subtitleRouter.get('/download/:subtitleId', downloadSubtitle)

subtitleRouter.post('/thanks/:subtitleId', authenticate, thankSubtitleUploader)

subtitleRouter.get(
  '/reports/pending',
  requireAdminRights,
  getPendingSubtitleReports
)

subtitleRouter.get(
  '/reports/approved',
  requireAdminRights,
  getApprovedSubtitleReports
)

subtitleRouter.get(
  '/reports/rejected',
  requireAdminRights,
  getRejectedSubtitleReports
)

subtitleRouter.patch(
  '/report/approve/:reportId',
  requireAdminRights,
  approveSubtitleReport
)

subtitleRouter.patch(
  '/report/reject/:reportId',
  requireAdminRights,
  rejectSubtitleReport
)

subtitleRouter.post(
  '/report/:subtitleId',
  authenticate,
  validateBody(subtitleReportValidator),
  reportSubtitle
)

subtitleRouter.patch(
  '/confirm/:subtitleId',
  requireAdminRights,
  confirmSubtitle
)

subtitleRouter.get('/by/:userId', getSubtitlesByUser)
subtitleRouter.get('/my/:episodeId', authenticate, getUserSubtitlesForEpisode)
subtitleRouter.get('/:episodeId', passUserToRequest, getSubtitlesForEpisode)

subtitleRouter.delete('/:subtitleId', authenticate, deleteSubtitle)

subtitleRouter.post(
  '/requests',
  authenticate,
  validateBody(subtitleRequestValidator),
  addSubtitleRequest
)

subtitleRouter.patch(
  '/requests/reopen/:requestId',
  authenticate,
  reopenSubtitleRequest
)

subtitleRouter.patch(
  '/requests/:requestId/fulfill/:subtitleId',
  authenticate,
  fulfillRequestWithExistingSubtitle
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
