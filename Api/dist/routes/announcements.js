"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const announcements_1 = require("../controllers/announcements");
const bodyMiddleware_1 = require("../middleware/bodyMiddleware");
const announcementValidator_1 = require("../middleware/validators/announcementValidator");
const announcementRouter = express_1.default.Router();
announcementRouter.post('', authMiddleware_1.requireAdminRights, (0, bodyMiddleware_1.validateBody)(announcementValidator_1.announcementCreateValidator), announcements_1.addAnnouncement);
announcementRouter.put('/:announcementId', authMiddleware_1.requireAdminRights, (0, bodyMiddleware_1.validateBody)(announcementValidator_1.announcementUpdateValidator), announcements_1.updateAnnouncement);
announcementRouter.delete('/:announcementId', authMiddleware_1.requireAdminRights, announcements_1.deleteAnnouncement);
announcementRouter.get('/tv-show/:tvShowId', announcements_1.getAnnouncementsForTVShow);
announcementRouter.get('/watchlisted-only', authMiddleware_1.authenticate, announcements_1.getAllAnnouncementsForWatchlistedTVShowOnly);
announcementRouter.get('', announcements_1.getAllAnnouncements);
exports.default = announcementRouter;
