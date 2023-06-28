"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tv_shows_1 = require("../controllers/tv-shows");
const authMiddleware_1 = require("../middleware/authMiddleware");
const tvShowRouter = express_1.default.Router();
tvShowRouter.get('/search', tv_shows_1.searchTVShows);
tvShowRouter.get('/popular', tv_shows_1.popularTVShows);
tvShowRouter.get('/:tvShowId/season/:season', authMiddleware_1.passUserToRequest, tv_shows_1.getTVShowSeasonDetails);
tvShowRouter.get('/:tvShowId', authMiddleware_1.passUserToRequest, tv_shows_1.getTVShowDetails);
exports.default = tvShowRouter;
