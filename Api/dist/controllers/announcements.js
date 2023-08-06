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
exports.deleteAnnouncement = exports.getAllAnnouncementsForWatchlistedTVShowOnly = exports.getAllAnnouncements = exports.getAnnouncementsForTVShow = exports.updateAnnouncement = exports.addAnnouncement = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const announcement_1 = __importDefault(require("../models/announcement"));
const pageSize = 10;
// @desc add new announcement for a tv show
// @route POST /announcements/tv-show/:tvShowId
// @access Admin
const addAnnouncement = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const announcement = req.body;
    axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(announcement.tvShowId));
    const instertedAnnouncement = yield announcement_1.default.create(announcement);
    res.status(201).json(instertedAnnouncement);
}));
exports.addAnnouncement = addAnnouncement;
// @desc update announcement for a tv show
// @route PUT /announcements/:announcementId
// @access Admin
const updateAnnouncement = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const announcementId = req.params.announcementId;
    const announcement = req.body;
    console.log(announcementId);
    const existingAnnouncement = yield announcement_1.default.findById(announcementId);
    if (!existingAnnouncement)
        throw new errorMiddleware_1.CustomError('Announcement not found', 404);
    existingAnnouncement.text = announcement.text;
    yield existingAnnouncement.save();
    res.status(201).json(existingAnnouncement);
}));
exports.updateAnnouncement = updateAnnouncement;
// @desc get announcements for a tv show
// @route GET /announcements/tv-show/:tvShowId
// @access Public
const getAnnouncementsForTVShow = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const tvShowId = Number(req.params.tvShowId);
    if (!tvShowId)
        throw new errorMiddleware_1.CustomError('Invalid parameter', 400);
    const options = {
        page: pageNumber,
        limit: pageSize,
        sort: { updatedAt: -1 },
        lean: true,
    };
    const result = yield announcement_1.default.paginate({ tvShowId }, options);
    res.json(result);
}));
exports.getAnnouncementsForTVShow = getAnnouncementsForTVShow;
// @desc get all announcements as paged
// @route GET /announcements
// @access Public
const getAllAnnouncements = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const options = {
        page: pageNumber,
        limit: pageSize,
        sort: { updatedAt: -1 },
        lean: true,
    };
    const result = yield announcement_1.default.paginate({}, options);
    const announcements = result.docs;
    for (const item of announcements) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.tvShowId));
        const tvShow = response.data;
        item.tvShowTitle = tvShow.name;
    }
    res.json(result);
}));
exports.getAllAnnouncements = getAllAnnouncements;
// @desc get all announcements for watchlisted tv shows only
// @route GET /announcements/watchlisted-only
// @access Private
const getAllAnnouncementsForWatchlistedTVShowOnly = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const pageNumber = Number(req.query.page) || 1;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const announcementsQuery = announcement_1.default.aggregate([
        {
            $lookup: {
                from: 'watchlists',
                let: { tvShowId: '$tvShowId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', userId] },
                                    { $eq: ['$tvShowId', '$$tvShowId'] },
                                ],
                            },
                        },
                    },
                ],
                as: 'watchlists',
            },
        },
        {
            $match: {
                watchlists: { $ne: [] },
            },
        },
        {
            $project: {
                _id: 1,
                tvShowId: 1,
                text: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
        {
            $sort: {
                updatedAt: -1,
            },
        },
    ]);
    const options = {
        page: pageNumber,
        limit: pageSize,
        lean: true,
    };
    const result = yield announcement_1.default.aggregatePaginate(announcementsQuery, options);
    for (const item of result.docs) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.tvShowId));
        const tvShow = response.data;
        item.tvShowTitle = tvShow.name;
    }
    res.json(result);
}));
exports.getAllAnnouncementsForWatchlistedTVShowOnly = getAllAnnouncementsForWatchlistedTVShowOnly;
const deleteAnnouncement = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const announcementId = req.params.announcementId;
    const announcement = yield announcement_1.default.findById(announcementId);
    if (!announcement)
        throw new errorMiddleware_1.CustomError('Announcement not found', 404);
    yield announcement.deleteOne();
    res.json('Success');
}));
exports.deleteAnnouncement = deleteAnnouncement;
