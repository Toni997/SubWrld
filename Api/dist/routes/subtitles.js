"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const subtitles_1 = require("../controllers/subtitles");
const bodyMiddleware_1 = require("../middleware/bodyMiddleware");
const multer_1 = require("../config/multer");
const onlyMultipartDataAllowed_1 = __importDefault(require("../middleware/onlyMultipartDataAllowed"));
const subtitleRequestValidator_1 = require("../middleware/validators/subtitleRequestValidator");
const subtitleReportValidator_1 = require("../middleware/validators/subtitleReportValidator");
const subtitleRouter = express_1.default.Router();
subtitleRouter.get('', authMiddleware_1.authenticate, subtitles_1.getAllSubtitles);
subtitleRouter.post('', authMiddleware_1.authenticate, onlyMultipartDataAllowed_1.default, multer_1.createSubtitleMulter.array('files', 5), subtitles_1.addSubtitle);
subtitleRouter.put('/:subtitleId', authMiddleware_1.authenticate, onlyMultipartDataAllowed_1.default, multer_1.updateSubtitleMulter.array('files', 5), subtitles_1.updateSubtitle);
subtitleRouter.get('/download/:subtitleId', subtitles_1.downloadSubtitle);
subtitleRouter.post('/thanks/:subtitleId', authMiddleware_1.authenticate, subtitles_1.thankSubtitleUploader);
subtitleRouter.get('/reports/pending', authMiddleware_1.requireAdminRights, subtitles_1.getPendingSubtitleReports);
subtitleRouter.get('/reports/approved', authMiddleware_1.requireAdminRights, subtitles_1.getApprovedSubtitleReports);
subtitleRouter.get('/reports/rejected', authMiddleware_1.requireAdminRights, subtitles_1.getRejectedSubtitleReports);
subtitleRouter.patch('/report/approve/:reportId', authMiddleware_1.requireAdminRights, subtitles_1.approveSubtitleReport);
subtitleRouter.patch('/report/reject/:reportId', authMiddleware_1.requireAdminRights, subtitles_1.rejectSubtitleReport);
subtitleRouter.post('/report/:subtitleId', authMiddleware_1.authenticate, (0, bodyMiddleware_1.validateBody)(subtitleReportValidator_1.subtitleReportValidator), subtitles_1.reportSubtitle);
subtitleRouter.patch('/confirm/:subtitleId', authMiddleware_1.requireAdminRights, subtitles_1.confirmSubtitle);
subtitleRouter.get('/by/:userId', subtitles_1.getSubtitlesByUser);
subtitleRouter.get('/my/:episodeId', authMiddleware_1.authenticate, subtitles_1.getUserSubtitlesForEpisode);
subtitleRouter.get('/:episodeId', authMiddleware_1.passUserToRequest, subtitles_1.getSubtitlesForEpisode);
subtitleRouter.delete('/:subtitleId', authMiddleware_1.authenticate, subtitles_1.deleteSubtitle);
subtitleRouter.post('/requests', authMiddleware_1.authenticate, (0, bodyMiddleware_1.validateBody)(subtitleRequestValidator_1.subtitleRequestValidator), subtitles_1.addSubtitleRequest);
subtitleRouter.patch('/requests/reopen/:requestId', authMiddleware_1.authenticate, subtitles_1.reopenSubtitleRequest);
subtitleRouter.patch('/requests/:requestId/fulfill/:subtitleId', authMiddleware_1.authenticate, subtitles_1.fulfillRequestWithExistingSubtitle);
subtitleRouter.get('/requests/:episodeId', authMiddleware_1.passUserToRequest, subtitles_1.getSubtitleRequestsForEpisode);
subtitleRouter.delete('/requests/:requestId', authMiddleware_1.authenticate, subtitles_1.deleteSubtitleRequest);
exports.default = subtitleRouter;
