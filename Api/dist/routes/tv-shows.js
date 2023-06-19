"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tv_shows_1 = require("../controllers/tv-shows");
const searchRouter = express_1.default.Router();
searchRouter.get('/search', tv_shows_1.searchTVShows);
searchRouter.get('/popular', tv_shows_1.popularTVShows);
exports.default = searchRouter;
