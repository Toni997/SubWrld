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
exports.updateSubtitle = exports.confirmSubtitle = exports.thankSubtitleUploader = exports.deleteSubtitle = exports.getSubtitlesForEpisode = exports.downloadSubtitle = exports.addSubtitle = exports.deleteSubtitleRequest = exports.getSubtitleRequestsForEpisode = exports.addSubtitleRequest = void 0;
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
const mmmagic_1 = require("mmmagic");
const convertStringifiedBoolean_1 = require("../utils/convertStringifiedBoolean");
const ensureAllowedMimeTypeForFiles = (files) => {
    const magic = new mmmagic_1.Magic(mmmagic_1.MAGIC_MIME_TYPE);
    for (const file of files) {
        const filePath = path_1.default.join(multer_1.tempFolderPath, file.filename);
        magic.detectFile(filePath, function (err, result) {
            if (err)
                throw new errorMiddleware_1.CustomError('Unsupported files', 415);
            if (!multer_1.allowedMimeTypes.includes(result)) {
                throw new errorMiddleware_1.CustomError('Unsupported files', 415);
            }
        });
    }
};
const uploadAndZipFiles = (files) => {
    const zipFileName = (0, uuid_1.v4)() + '.zip';
    const zipFilePath = path_1.default.join(multer_1.subtitlesFolderPath, zipFileName);
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
    return zipFileName;
};
// @desc get all subtitles for a specific episode
// @route GET /subtitles/:episodeId
// @access Public
const getSubtitlesForEpisode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const episodeId = Number(req.params.episodeId);
    if (!episodeId)
        throw new errorMiddleware_1.CustomError('Invalid parameter', 400);
    const subtitles = yield subtitle_1.default.aggregate([
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
            $addFields: {
                isOwner: {
                    $eq: ['$userId', userId],
                },
                thankedByCount: { $size: '$thankedBy' },
                isThankedByUser: { $in: [userId, '$thankedBy'] },
            },
        },
        {
            $project: {
                'user.email': 0,
                'user.password': 0,
                'user.updatedAt': 0,
                'user.createdAt': 0,
                thankedBy: 0,
            },
        },
        {
            $sort: {
                isOwner: -1,
                updatedAt: -1,
            },
        },
    ]);
    res.json(subtitles);
}));
exports.getSubtitlesForEpisode = getSubtitlesForEpisode;
// @desc Add subtitle
// @route POST /subtitles
// @access Private
const addSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const subtitle = req.body;
    const files = req.files;
    let subtitleRequest;
    if (subtitle.subtitleRequestId) {
        subtitleRequest = yield subtitleRequest_1.default.findById(subtitle.subtitleRequestId);
        if (!subtitleRequest)
            throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
        if (subtitleRequest.tvShowId !== Number(subtitle.tvShowId) ||
            subtitleRequest.season !== Number(subtitle.season) ||
            subtitleRequest.episode !== Number(subtitle.episode)) {
            throw new errorMiddleware_1.CustomError('You are trying to relate a subtitle with a subtitle request made for a different episode', 401);
        }
        if (!(files === null || files === void 0 ? void 0 : files.length))
            throw new errorMiddleware_1.CustomError('Subtitles related to a subtitle request must have at least one file attached', 401);
    }
    subtitleRequest = subtitleRequest;
    if (files === null || files === void 0 ? void 0 : files.length)
        ensureAllowedMimeTypeForFiles(files);
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
        forHearingImpaired: (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.forHearingImpaired),
        isWorkInProgress: (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.isWorkInProgress),
        onlyForeignLanguage: (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.onlyForeignLanguage),
        uploaderIsAuthor: (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.uploaderIsAuthor),
        release: subtitle.release,
        subtitleRequestId: subtitle.subtitleRequestId
            ? new mongoose_1.default.Types.ObjectId(subtitle.subtitleRequestId)
            : null,
        filePath: null,
    };
    if (files === null || files === void 0 ? void 0 : files.length) {
        const zipFilePath = uploadAndZipFiles(files);
        subtitleToInsert.filePath = zipFilePath;
    }
    const insertedSubtitle = yield subtitle_1.default.create(subtitleToInsert);
    subtitleRequest.subtitleId = insertedSubtitle._id;
    subtitleRequest.save();
    res.status(201).json(insertedSubtitle);
}));
exports.addSubtitle = addSubtitle;
// @desc Update subtitle
// @route PUT /subtitles/:subtitleId
// @access Private
const updateSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const subtitle = req.body;
    const subtitleId = req.params.subtitleId;
    const files = req.files;
    const subtitleToUpdate = yield subtitle_1.default.findById(subtitleId);
    if (!subtitleToUpdate)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    if (user._id.toString() !== subtitleToUpdate.userId.toString() &&
        !user.isAdmin)
        throw new errorMiddleware_1.CustomError('Not authorized', 403);
    if (subtitleToUpdate.isConfirmed)
        throw new errorMiddleware_1.CustomError("Can't update a confirmed subtitle", 409);
    const oldFilePath = subtitleToUpdate.filePath;
    if (files)
        ensureAllowedMimeTypeForFiles(files);
    subtitleToUpdate.language = subtitle.language;
    subtitleToUpdate.frameRate = Number(subtitle.frameRate);
    subtitleToUpdate.forHearingImpaired = (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.forHearingImpaired);
    subtitleToUpdate.isWorkInProgress = (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.isWorkInProgress);
    subtitleToUpdate.onlyForeignLanguage = (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.onlyForeignLanguage);
    subtitleToUpdate.uploaderIsAuthor = (0, convertStringifiedBoolean_1.convertStringifiedBoolean)(subtitle.uploaderIsAuthor);
    subtitleToUpdate.release = subtitle.release;
    if (files === null || files === void 0 ? void 0 : files.length) {
        const zipFilePath = uploadAndZipFiles(files);
        subtitleToUpdate.filePath = zipFilePath;
        if (oldFilePath) {
            const oldFileFullPath = path_1.default.join(multer_1.subtitlesFolderPath, oldFilePath);
            fs_1.default.unlinkSync(oldFileFullPath);
        }
    }
    yield subtitleToUpdate.save();
    res.status(200).json(subtitleToUpdate);
}));
exports.updateSubtitle = updateSubtitle;
// @desc delete subtitle
// @route DELETE /subtitles/:requestId
// @access Private
const deleteSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const isAdmin = (_c = req.user) === null || _c === void 0 ? void 0 : _c.isAdmin;
    const subtitleId = req.params.subtitleId;
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
    if (subtitle.userId.toString() !== userId.toString() && !isAdmin)
        throw new errorMiddleware_1.CustomError('Not authorized', 401);
    yield subtitle.deleteOne();
    res.json('Removed subtitle');
}));
exports.deleteSubtitle = deleteSubtitle;
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
    res.download(filePath, fullDownloadFileName, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err)
            throw new Error('Error downloading file');
        subtitle.downloads += 1;
        yield subtitle.save();
    }));
}));
exports.downloadSubtitle = downloadSubtitle;
// @desc thank subtitle uploader
// @route POST /subtitles/thanks/:subtitleId
// @access Public
const thankSubtitleUploader = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
    const subtitleId = req.params.subtitleId;
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    if (subtitle.userId.toString() === userId.toString())
        throw new errorMiddleware_1.CustomError("You can't thank for a subtitle you uploaded", 409);
    if (subtitle.thankedBy.includes(userId))
        throw new errorMiddleware_1.CustomError('Already thanked for this subtitle', 409);
    subtitle.thankedBy.push(userId);
    yield subtitle.save();
    res.status(201).json('Success');
}));
exports.thankSubtitleUploader = thankSubtitleUploader;
// @desc confirm subtitle
// @route PATCH /subtitles/confirm/:subtitleId
// @access Admin
const confirmSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subtitleId = req.params.subtitleId;
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    if (subtitle.isConfirmed)
        throw new errorMiddleware_1.CustomError('Already confirmed this subtitle', 409);
    if (subtitle.isWorkInProgress)
        throw new errorMiddleware_1.CustomError("Can't confirm a subtitle that's a work in progress", 409);
    subtitle.isConfirmed = true;
    yield subtitle.save();
    res.json('Success');
}));
exports.confirmSubtitle = confirmSubtitle;
// @desc add subtite request
// @route POST /subtitles/requests
// @access Public
const addSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const user = req.user;
    const subtitleRequest = req.body;
    const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(subtitleRequest.tvShowId, subtitleRequest.season, subtitleRequest.episode));
    const episodeDetails = response.data;
    subtitleRequest.userId = user._id;
    subtitleRequest.episodeId = episodeDetails.id;
    subtitleRequest.comment = ((_e = subtitleRequest.comment) === null || _e === void 0 ? void 0 : _e.trim()) || null;
    const insertedSubtitleRequest = yield subtitleRequest_1.default.create(subtitleRequest);
    res.status(201).json(insertedSubtitleRequest);
}));
exports.addSubtitleRequest = addSubtitleRequest;
// @desc get all subtitle requests for a specific episode
// @route GET /subtitles/requests/:episodeId
// @access Public
const getSubtitleRequestsForEpisode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
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
            $lookup: {
                from: 'subtitles',
                localField: 'subtitleId',
                foreignField: '_id',
                as: 'subtitle',
            },
        },
        {
            $unwind: {
                path: '$subtitle',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subtitle.userId',
                foreignField: '_id',
                as: 'subtitle.user',
            },
        },
        {
            $project: {
                'user.email': 0,
                'user.password': 0,
                'user.isAdmin': 0,
                'user.updatedAt': 0,
                'subtitle.user.email': 0,
                'subtitle.user.password': 0,
                'subtitle.user.isAdmin': 0,
                'subtitle.user.updatedAt': 0,
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
                updatedAt: -1,
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
    var _g, _h;
    const userId = (_g = req.user) === null || _g === void 0 ? void 0 : _g._id;
    const isAdmin = (_h = req.user) === null || _h === void 0 ? void 0 : _h.isAdmin;
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
