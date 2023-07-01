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
exports.setDarkMode = exports.markEpisodeWatched = exports.removeEpisodeFromWatched = exports.checkEpisodeWatched = exports.removeFromWatchlist = exports.addToWatchlist = exports.checkWatchlisted = exports.getWatchlist = exports.updateUser = exports.getUser = exports.signupUser = exports.loginUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const user_1 = __importDefault(require("../models/user"));
const watchlist_1 = __importDefault(require("../models/watchlist"));
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const watchedEpisodesValidator_1 = require("../middleware/validators/watchedEpisodesValidator");
const watchedEpisodes_1 = __importDefault(require("../models/watchedEpisodes"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// @desc Auth user & get token
// @route POST /users/login
// @access Public
const loginUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield user_1.default.findOne({ username });
    if (user && (yield user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            darkMode: user.darkMode,
            token: (0, generateToken_1.default)(user),
        });
    }
    else {
        throw new errorMiddleware_1.CustomError('Invalid email or password', 401);
    }
}));
exports.loginUser = loginUser;
// @desc Register a new user
// @route POST /users
// @access Public
const signupUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    const usernameExists = yield user_1.default.findOne({ username });
    if (usernameExists)
        throw new errorMiddleware_1.CustomError('Username already exists', 400);
    const emailExists = yield user_1.default.findOne({ email });
    if (emailExists)
        throw new errorMiddleware_1.CustomError('Email already exists', 400);
    const user = yield user_1.default.create({
        username,
        email,
        password,
    });
    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: (0, generateToken_1.default)(user),
        });
    }
    else {
        throw new errorMiddleware_1.CustomError('Invalid user data', 400);
    }
}));
exports.signupUser = signupUser;
// @desc Update user
// @route PUT /users
// @access Private
const updateUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    if (user) {
        user.username = req.body.name || user.username;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }
        const updatedUser = yield user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: (0, generateToken_1.default)(updatedUser),
        });
    }
    else {
        throw new errorMiddleware_1.CustomError('User not found', 404);
    }
}));
exports.updateUser = updateUser;
// @desc Get user
// @route GET /users/:userId
// @access Public
const getUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findById(req.params.userId).select('-password -watchlist');
    if (user) {
        res.json(user);
    }
    else {
        throw new errorMiddleware_1.CustomError('User not found', 404);
    }
}));
exports.getUser = getUser;
// @desc Get user watchlist
// @route GET /users/watchlist
// @access Private
const getWatchlist = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const watchlist = yield watchlist_1.default.find({
        userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
    }).lean();
    for (const item of watchlist) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.tvShowId));
        const tvShow = response.data;
        item.title = tvShow.name;
        item.next_episode_to_air = tvShow.next_episode_to_air;
        item.status = tvShow.status;
    }
    res.json(watchlist);
}));
exports.getWatchlist = getWatchlist;
// @desc check if user has watchlisted a tv show
// @route GET /users/watchlisted/:tvShowId
// @access Private
const checkWatchlisted = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const watchlisted = yield watchlist_1.default.findOne({
        userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
        tvShowId: req.params.tvShowId,
    });
    res.json(!!watchlisted);
}));
exports.checkWatchlisted = checkWatchlisted;
// @desc add tv show to watchlist
// @route POST /users/watchlist/:tvShowId
// @access Private
const addToWatchlist = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const userId = new mongoose_1.default.Types.ObjectId((_d = req.user) === null || _d === void 0 ? void 0 : _d._id);
    const tvShowId = Number(req.params.tvShowId);
    const watchlisted = yield watchlist_1.default.findOne({
        userId,
        tvShowId,
    });
    yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(tvShowId));
    if (watchlisted)
        throw new errorMiddleware_1.CustomError('You have already watchlisted this show', 422);
    const insertedWatchlist = yield watchlist_1.default.create({
        userId,
        tvShowId,
    });
    res.status(201).json(insertedWatchlist);
}));
exports.addToWatchlist = addToWatchlist;
// @desc remove tv show from watchlist
// @route DELETE /api/users/watchlist/:tvShowId
// @access Private
const removeFromWatchlist = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
    const { tvShowIds } = req.body;
    const watchlistedToInsert = [];
    for (const tvShowId of tvShowIds) {
        const watchlisted = yield watchlist_1.default.findOne({
            userId,
            tvShowId,
        });
        if (watchlisted) {
            watchlistedToInsert.push(tvShowId);
        }
    }
    if (watchlistedToInsert.length)
        yield watchlist_1.default.deleteMany({
            userId,
            tvShowId: { $in: watchlistedToInsert },
        });
    res.json(`Removed ${watchlistedToInsert.length} TV shows from your watchlist`);
}));
exports.removeFromWatchlist = removeFromWatchlist;
// @desc check if user has marked episode as watched
// @route GET /api/users/watched/:episodeId
// @access Private
const checkEpisodeWatched = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const watchedEpisode = yield watchedEpisodes_1.default.findOne({
        userId: (_f = req.user) === null || _f === void 0 ? void 0 : _f._id,
        episodeId: req.params.episodeId,
    });
    res.json(!!watchedEpisode);
}));
exports.checkEpisodeWatched = checkEpisodeWatched;
const fetchSeasonEpisodes = (tvShowId, season) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowSeasonDetailsUrl)(tvShowId, season));
    const seasonDetails = response.data;
    return seasonDetails.episodes;
});
const handleMarkWatched = (userId, tvShowId, watched, alreadyWatchedEpisodes, watchedEpisodesToInsert) => __awaiter(void 0, void 0, void 0, function* () {
    const season = watched.season;
    const episodes = watched.episodes;
    const { error } = watchedEpisodesValidator_1.markWatchedEpisodesValidator.validate(watched);
    if (error)
        throw new errorMiddleware_1.CustomError(error.details[0].message, 400);
    if (episodes === null) {
        const seasonEpisodes = yield fetchSeasonEpisodes(tvShowId, season);
        for (const episodeDetails of seasonEpisodes) {
            const alreadyExists = alreadyWatchedEpisodes.find(w => w.episode === episodeDetails.episode_number);
            if (!alreadyExists) {
                watchedEpisodesToInsert.push({
                    userId,
                    tvShowId,
                    season,
                    episode: episodeDetails.episode_number,
                    episodeId: episodeDetails.id,
                });
            }
        }
    }
    else if (Array.isArray(episodes)) {
        const from = episodes[0];
        const to = episodes[1];
        const seasonEpisodes = yield fetchSeasonEpisodes(tvShowId, season);
        for (const episodeDetails of seasonEpisodes) {
            const episodeNumber = episodeDetails.episode_number;
            const shouldInsert = episodeNumber >= from &&
                episodeNumber <= to &&
                !alreadyWatchedEpisodes.find(w => w.episode === episodeDetails.episode_number);
            if (shouldInsert) {
                watchedEpisodesToInsert.push({
                    userId,
                    tvShowId,
                    season,
                    episode: episodeDetails.episode_number,
                    episodeId: episodeDetails.id,
                });
            }
        }
    }
    else {
        const { data: seasonDetails } = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(tvShowId, season, episodes));
        const alreadyExists = !!alreadyWatchedEpisodes.find(w => w.episode === seasonDetails.episode_number);
        if (!alreadyExists) {
            watchedEpisodesToInsert.push({
                userId,
                tvShowId,
                season,
                episode: seasonDetails.episode_number,
                episodeId: seasonDetails.id,
            });
        }
    }
});
// @desc mark episode as watched
// @route POST /users/mark-watched
// @access Private
const markEpisodeWatched = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const userId = new mongoose_1.default.Types.ObjectId((_g = req.user) === null || _g === void 0 ? void 0 : _g._id);
    const markWatched = req.body;
    const watchedEpisodesToInsert = [];
    yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(markWatched.tvShowId));
    const alreadyWatchedEpisodes = yield watchedEpisodes_1.default.find({
        userId,
        tvShowId: markWatched.tvShowId,
    });
    for (const watched of markWatched.watched) {
        const alreadyWatchedEpisodesInASeason = alreadyWatchedEpisodes.filter(w => w.season === watched.season);
        yield handleMarkWatched(userId, markWatched.tvShowId, watched, alreadyWatchedEpisodesInASeason, watchedEpisodesToInsert);
    }
    if (watchedEpisodesToInsert.length) {
        yield watchedEpisodes_1.default.insertMany(watchedEpisodesToInsert);
        res
            .status(201)
            .json(`Added ${watchedEpisodesToInsert.length} watched episodes`);
    }
    else {
        res.status(200).json('All episodes have already been marked as watched');
    }
}));
exports.markEpisodeWatched = markEpisodeWatched;
// @desc remove episode from watched
// @route DELETE /users/watched/:episodeId
// @access Private
const removeEpisodeFromWatched = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    const userId = (_h = req.user) === null || _h === void 0 ? void 0 : _h._id;
    const episodeId = Number(req.params.episodeId);
    const watchedEpisode = yield watchedEpisodes_1.default.findOne({
        userId,
        episodeId,
    });
    if (!watchedEpisode)
        throw new errorMiddleware_1.CustomError("You haven't marked this episode as watched yet", 422);
    yield watchedEpisode.deleteOne();
    res.json('Removed from watched episodes');
}));
exports.removeEpisodeFromWatched = removeEpisodeFromWatched;
// @desc set dark mode
// @route PATCH /users/set-dark-mode
// @access Private
const setDarkMode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { darkMode } = req.body;
    const authenticatedUser = req.user;
    yield user_1.default.updateOne({ _id: authenticatedUser._id }, { darkMode });
    res.json('Success');
}));
exports.setDarkMode = setDarkMode;
