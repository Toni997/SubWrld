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
exports.downloadSubtitle = exports.addSubtitle = exports.deleteSubtitleRequest = exports.getSubtitleRequestsForEpisode = exports.addSubtitleRequest = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const subtitleRequest_1 = __importDefault(require("../models/subtitleRequest"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const mongoose_1 = __importDefault(require("mongoose"));
const subtitle_1 = __importDefault(require("../models/subtitle"));
const uuid_1 = require("uuid");
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = require("../config/multer");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// @desc Add subtitle
// @route POST /subtitles
// @access Private
const addSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const subtitle = req.body;
    const files = req.files;
    if (subtitle.subtitleRequestId) {
        const foundRequest = yield subtitleRequest_1.default.findById(subtitle.subtitleRequestId);
        if (!foundRequest)
            throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
    }
    const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(subtitle.tvShowId, subtitle.season, subtitle.episode));
    const episodeDetails = response.data;
    const subtitleToInsert = {
        userId: user._id,
        tvShowId: Number(subtitle.tvShowId),
        season: Number(subtitle.season),
        episode: Number(subtitle.episode),
        episodeId: episodeDetails.id,
        language: subtitle.language,
        frameRate: Number(subtitle.frameRate),
        forHearingImpaired: Boolean(subtitle.forHearingImpaired),
        isWorkInProgress: Boolean(subtitle.isWorkInProgress),
        onlyForeignLanguage: Boolean(subtitle.onlyForeignLanguage),
        uploaderIsAuthor: Boolean(subtitle.uploaderIsAuthor),
        release: subtitle.release.replace(/\s+/g, ' '),
        subtitleRequestId: subtitle.subtitleRequestId
            ? new mongoose_1.default.Types.ObjectId(subtitle.subtitleRequestId)
            : null,
        filePath: null,
    };
    if (files === null || files === void 0 ? void 0 : files.length) {
        const zipFileName = (0, uuid_1.v4)() + '.zip';
        const zipFilePath = path_1.default.join(multer_1.subtitlesFolderPath, zipFileName);
        subtitleToInsert.filePath = zipFileName;
        const output = fs_1.default.createWriteStream(zipFilePath);
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 },
        });
        archive.pipe(output);
        for (const file of files) {
            const filePath = path_1.default.join(multer_1.tempFolderPath, file.filename);
            archive.file(filePath, { name: file.originalname });
        }
        archive.finalize();
    }
    const insertedSubtitle = yield subtitle_1.default.create(subtitleToInsert);
    res.status(201).json(insertedSubtitle);
    if (!files)
        return;
    for (const file of files) {
        const filePath = path_1.default.join(multer_1.tempFolderPath, file.filename);
        fs_1.default.unlinkSync(filePath);
    }
}));
exports.addSubtitle = addSubtitle;
// @desc download subtitle
// @route GET /subtitles/:subtitleId
// @access Public
const downloadSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subtitleId = req.params.subtitleId;
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle || !subtitle.filePath)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(subtitle.tvShowId));
    const tvShowDetails = response.data;
    const tvShowName = tvShowDetails.name
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/\s+/g, '.');
    const seasonAndEpisode = `S${subtitle.season}E${subtitle.episode}`;
    const extension = 'zip';
    const fullDownloadFileName = `${tvShowName}.${seasonAndEpisode}.${subtitle.release}.${subtitle.language}.${extension}`;
    const filePath = path_1.default.join(multer_1.subtitlesFolderPath, subtitle.filePath);
    res.download(filePath, fullDownloadFileName, err => {
        if (err)
            throw new Error('Error downloading file');
    });
}));
exports.downloadSubtitle = downloadSubtitle;
// @desc add subtite request
// @route POST /subtitles/requests
// @access Public
const addSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const subtitleRequest = req.body;
    const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(subtitleRequest.tvShowId, subtitleRequest.season, subtitleRequest.episode));
    const episodeDetails = response.data;
    subtitleRequest.userId = user._id;
    subtitleRequest.episodeId = episodeDetails.id;
    subtitleRequest.comment = ((_a = subtitleRequest.comment) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    const insertedSubtitleRequest = yield subtitleRequest_1.default.create(subtitleRequest);
    res.status(201).json(insertedSubtitleRequest);
}));
exports.addSubtitleRequest = addSubtitleRequest;
// @desc get all subtitle requests for a specific episode
// @route GET /subtitles/requests/:episodeId
// @access Public
const getSubtitleRequestsForEpisode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const episodeId = Number(req.params.episodeId);
    if (!episodeId)
        throw new errorMiddleware_1.CustomError('Invalid parameter', 400);
    const subtitleRequests = yield subtitleRequest_1.default.aggregate([
        {
            $match: { episodeId }, // Replace epsidoeid with the specific episodeId
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $unwind: '$user',
        },
        {
            $project: {
                'user.email': 0,
                'user.password': 0,
                'user.isAdmin': 0,
                'user.updatedAt': 0,
            },
        },
        {
            $addFields: {
                isOwner: {
                    $eq: ['$userId', userId], // Create a new field isOwner to check if userId matches user._id
                },
            },
        },
        {
            $sort: {
                isOwner: -1,
                createdAt: -1,
            },
        },
    ]);
    res.json(subtitleRequests);
}));
exports.getSubtitleRequestsForEpisode = getSubtitleRequestsForEpisode;
// @desc delete a subtitle request
// @route DELETE /subtitles/requests/:requestId
// @access Private
const deleteSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
    const isAdmin = (_d = req.user) === null || _d === void 0 ? void 0 : _d.isAdmin;
    const requestId = req.params.requestId;
    const subtitleRequest = yield subtitleRequest_1.default.findById(requestId);
    if (!subtitleRequest)
        throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
    if (subtitleRequest.userId.toString() !== userId.toString() && !isAdmin)
        throw new errorMiddleware_1.CustomError('Not authorized', 401);
    yield subtitleRequest.deleteOne();
    res.json('Removed subtitle request');
}));
exports.deleteSubtitleRequest = deleteSubtitleRequest;
