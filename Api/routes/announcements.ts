import express from 'express'
import { authenticate, requireAdminRights } from '../middleware/authMiddleware'
import {
  addAnnouncement,
  getAllAnnouncements,
  getAllAnnouncementsForWatchlistedTVShowOnly,
  getAnnouncementsForTVShow,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements'
import { validateBody } from '../middleware/bodyMiddleware'
import {
  announcementCreateValidator,
  announcementUpdateValidator,
} from '../middleware/validators/announcementValidator'

const announcementRouter = express.Router()

announcementRouter.post(
  '',
  requireAdminRights,
  validateBody(announcementCreateValidator),
  addAnnouncement
)

announcementRouter.put(
  '/:announcementId',
  requireAdminRights,
  validateBody(announcementUpdateValidator),
  updateAnnouncement
)

announcementRouter.delete(
  '/:announcementId',
  requireAdminRights,
  deleteAnnouncement
)

announcementRouter.get('/tv-show/:tvShowId', getAnnouncementsForTVShow)

announcementRouter.get(
  '/watchlisted-only',
  authenticate,
  getAllAnnouncementsForWatchlistedTVShowOnly
)

announcementRouter.get('', getAllAnnouncements)

export default announcementRouter
