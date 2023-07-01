"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTVShowSeasonDetails = exports.getTVShowDetails = exports.popularTVShows = exports.searchTVShows = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const watchedEpisodes_1 = __importDefault(require("../models/watchedEpisodes"));
const watchlist_1 = __importDefault(require("../models/watchlist"));
const limitNumberOfResults = 10;
const addGenreNamesToShowsArray = (showsArray) => __awaiter(void 0, void 0, void 0, function* () {
    const genresResponse = yield axios_1.default.get(tmdb_api_1.genresUrl);
    const genres = genresResponse.data.genres;
    const genresObject = genres.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v.id]: v.name })), {});
    showsArray.forEach((show) => {
        const genreNames = show.genre_ids.map((id) => genresObject[id]);
        show.genre_names = genreNames;
    });
});
// @desc Search TV Shows that include keyword
// @route GET /tv-shows/search?keword=<keyword>
// @access Public
const searchTVShows = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const keyword = (_a = req.query.keyword) === null || _a === void 0 ? void 0 : _a.toString();
    if (!keyword || keyword.trim().length < 1) {
        throw new Error('Search keyword should be at least 1 character long');
    }
    try {
        const response = yield axios_1.default.get((0, tmdb_api_1.getSearchTVShowUrl)(keyword));
        let shows = response.data.results;
        shows = shows.slice(0, limitNumberOfResults);
        yield addGenreNamesToShowsArray(shows);
        res.json(shows);
    }
    catch (error) {
        res.status(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500);
        throw new Error(error.message || 'Error occurred');
    }
}));
exports.searchTVShows = searchTVShows;
// @desc Get popular TV shows
// @route GET /tv-shows/popular
// @access Public
const popularTVShows = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const response = yield axios_1.default.get(tmdb_api_1.popularTVShowsUrl);
        let shows = response.data.results;
        shows = shows.slice(0, limitNumberOfResults);
        yield addGenreNamesToShowsArray(shows);
        res.json(shows);
    }
    catch (error) {
        res.status(((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) || 500);
        throw new Error(error.message || 'Error occurred');
    }
}));
exports.popularTVShows = popularTVShows;
// @desc Get TV show details
// @route GET /tv-shows/:tvShowId
// @access Public
const getTVShowDetails = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const user = req.user;
    const { tvShowId } = req.params;
    try {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(tvShowId));
        const tvShow = response.data;
        if (!user) {
            res.json(tvShow);
            return;
        }
        const watchlisted = yield watchlist_1.default.findOne({
            userId: user._id,
            tvShowId,
        });
        tvShow.is_watchlisted_by_user = !!watchlisted;
        res.json(tvShow);
    }
    catch (error) {
        res.status(((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) || 500);
        throw new Error(error.message || 'Error occurred');
    }
}));
exports.getTVShowDetails = getTVShowDetails;
// @desc Get TV show season details
// @route GET /tv-shows/:tvShowId/season/:season
// @access Public
const getTVShowSeasonDetails = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const user = req.user;
    const { tvShowId, season } = req.params;
    try {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowSeasonDetailsUrl)(tvShowId, season));
        const seasonsDetails = response.data;
        if (!user) {
            res.json(seasonsDetails.episodes);
            return;
        }
        const watchedEpisodesByUser = yield watchedEpisodes_1.default.find({
            userId: user._id,
            tvShowId,
        });
        for (const episode of seasonsDetails.episodes) {
            const isMarkedAsWatched = !!watchedEpisodesByUser.find(w => w.episodeId === episode.id);
            episode.marked_as_watched = isMarkedAsWatched;
        }
        res.json(seasonsDetails.episodes);
    }
    catch (error) {
        res.status(((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 500);
        throw new Error(error.message || 'Error occurred');
    }
}));
exports.getTVShowSeasonDetails = getTVShowSeasonDetails;
