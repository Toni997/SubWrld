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
const subtitleRouter = express_1.default.Router();
subtitleRouter.post('', authMiddleware_1.authenticate, multer_1.upload.array('subtitles', 5), subtitles_1.addSubtitle);
subtitleRouter.get('/download/:subtitleId', subtitles_1.downloadSubtitle);
subtitleRouter.post('/requests', authMiddleware_1.authenticate, bodyMiddleware_1.validateSubtitleRequest, subtitles_1.addSubtitleRequest);
subtitleRouter.get('/requests/:episodeId', authMiddleware_1.passUserToRequest, subtitles_1.getSubtitleRequestsForEpisode);
subtitleRouter.delete('/requests/:requestId', authMiddleware_1.authenticate, subtitles_1.deleteSubtitleRequest);
exports.default = subtitleRouter;
