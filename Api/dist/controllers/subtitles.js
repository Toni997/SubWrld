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
exports.getAllSubtitles = exports.getSubtitlesByUser = exports.getRejectedSubtitleReports = exports.getApprovedSubtitleReports = exports.getPendingSubtitleReports = exports.approveSubtitleReport = exports.rejectSubtitleReport = exports.getUserSubtitlesForEpisode = exports.fulfillRequestWithExistingSubtitle = exports.reportSubtitle = exports.reopenSubtitleRequest = exports.updateSubtitle = exports.confirmSubtitle = exports.thankSubtitleUploader = exports.deleteSubtitle = exports.getSubtitlesForEpisode = exports.downloadSubtitle = exports.addSubtitle = exports.deleteSubtitleRequest = exports.getSubtitleRequestsForEpisode = exports.addSubtitleRequest = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = require("../config/multer");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const mmmagic_1 = require("mmmagic");
const convertStringifiedBoolean_1 = require("../utils/convertStringifiedBoolean");
const reportStatus_1 = require("../utils/reportStatus");
const subtitleReport_1 = __importDefault(require("../models/subtitleReport"));
const subtitleRequest_1 = __importDefault(require("../models/subtitleRequest"));
const user_1 = __importDefault(require("../models/user"));
const subtitle_1 = __importDefault(require("../models/subtitle"));
const pageSize = 10;
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
// @desc get all subtitles
// @route GET /subtitles
// @access Public
const getAllSubtitles = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const options = {
        page: pageNumber,
        limit: pageSize,
        select: '-thankedBy -userId',
        populate: {
            path: 'userId',
            select: '_id username reputation isAdmin',
        },
        sort: { updatedAt: -1 },
        lean: true,
    };
    const result = yield subtitle_1.default.paginate({}, options);
    const subtitles = result.docs;
    for (const item of subtitles) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.tvShowId));
        const tvShow = response.data;
        item.tvShowTitle = tvShow.name;
    }
    res.json(result);
}));
exports.getAllSubtitles = getAllSubtitles;
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
            $match: { episodeId },
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
// @desc get all subtitles for a specific episode uploaded by authenticated user
// @route GET /subtitles/my/:episodeId
// @access Private
const getUserSubtitlesForEpisode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const episodeId = Number(req.params.episodeId);
    if (!episodeId)
        throw new errorMiddleware_1.CustomError('Invalid parameter', 400);
    const subtitles = yield subtitle_1.default.find({
        userId,
        episodeId,
        subtitleRequestId: null,
        filePath: { $ne: null },
    })
        .select('_id language release frameRate createdAt updatedAt')
        .sort({ updatedAt: -1 });
    res.json(subtitles);
}));
exports.getUserSubtitlesForEpisode = getUserSubtitlesForEpisode;
// @desc get all subtitles by a specific user
// @route GET /subtitles/by/:userId
// @access Public
const getSubtitlesByUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const userId = req.params.userId;
    const options = {
        page: pageNumber,
        limit: pageSize,
        select: '-thankedBy -userId',
        sort: { updatedAt: -1 },
        lean: true,
    };
    const result = yield subtitle_1.default.paginate({ userId }, options);
    const subtitles = result.docs;
    for (const item of subtitles) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.tvShowId));
        const tvShow = response.data;
        item.tvShowTitle = tvShow.name;
    }
    res.json(result);
}));
exports.getSubtitlesByUser = getSubtitlesByUser;
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
    if (subtitleRequest) {
        subtitleRequest.subtitleId = insertedSubtitle._id;
        yield subtitleRequest.save();
    }
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
    if (!user._id.equals(subtitleToUpdate.userId) && !user.isAdmin)
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
    var _c, _d;
    const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
    const isAdmin = (_d = req.user) === null || _d === void 0 ? void 0 : _d.isAdmin;
    const subtitleId = req.params.subtitleId;
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
    if (!subtitle.userId.equals(userId) && !isAdmin)
        throw new errorMiddleware_1.CustomError('Not authorized', 403);
    if (subtitle.subtitleRequestId) {
        const relatedSubtitleRequest = yield subtitleRequest_1.default.findById(subtitle.subtitleRequestId);
        if (relatedSubtitleRequest) {
            relatedSubtitleRequest.subtitleId = null;
            yield relatedSubtitleRequest.save();
        }
    }
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
            throw new Error('Could not send file');
        subtitle.downloads += 1;
        yield subtitle.save();
    }));
}));
exports.downloadSubtitle = downloadSubtitle;
// @desc thank subtitle uploader
// @route POST /subtitles/thanks/:subtitleId
// @access Public
const thankSubtitleUploader = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
    const subtitleId = req.params.subtitleId;
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    if (subtitle.userId.equals(userId))
        throw new errorMiddleware_1.CustomError("You can't thank for a subtitle you uploaded", 409);
    if (subtitle.thankedBy.includes(userId))
        throw new errorMiddleware_1.CustomError('Already thanked for this subtitle', 409);
    subtitle.thankedBy.push(userId);
    yield subtitle.save();
    const uploader = yield user_1.default.findById(subtitle.userId);
    if (uploader) {
        uploader.reputation += 1;
        uploader.save();
    }
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
    const uploader = yield user_1.default.findById(subtitle.userId);
    if (uploader) {
        uploader.reputation += 50;
        uploader.save();
    }
    res.json('Success');
}));
exports.confirmSubtitle = confirmSubtitle;
// @desc confirm subtitle
// @route PATCH /subtitles/confirm/:subtitleId
// @access Admin
const fulfillRequestWithExistingSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
    const requestId = req.params.requestId;
    const subtitleId = req.params.subtitleId;
    const request = yield subtitleRequest_1.default.findById(requestId);
    if (!request)
        throw new errorMiddleware_1.CustomError('Request not found', 404);
    if (request.subtitleId)
        throw new errorMiddleware_1.CustomError('This request has already been fulfilled', 409);
    const subtitle = yield subtitle_1.default.findById(subtitleId);
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    if (!subtitle.userId.equals(userId))
        throw new errorMiddleware_1.CustomError('Not authorized', 403);
    if (subtitle.subtitleRequestId)
        throw new errorMiddleware_1.CustomError('This subtitle is already related to another request', 409);
    request.subtitleId = subtitle._id;
    yield request.save();
    subtitle.subtitleRequestId = request._id;
    yield subtitle.save();
    res.json('Success');
}));
exports.fulfillRequestWithExistingSubtitle = fulfillRequestWithExistingSubtitle;
// @desc get all pending subtitle reports
// @route PATCH /subtitles/reports/pending
// @access Admin
const getPendingSubtitleReports = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const options = {
        page: pageNumber,
        limit: pageSize,
        sort: { updatedAt: -1 },
        populate: [
            {
                path: 'subtitleId',
                select: '-thankedBy',
                populate: {
                    path: 'userId',
                    select: '_id username isAdmin reputation',
                },
            },
            { path: 'userId', select: '_id username isAdmin reputation' },
        ],
        lean: true,
    };
    const result = yield subtitleReport_1.default.paginate({ status: reportStatus_1.ReportStatus.Pending }, options);
    const reports = result.docs;
    for (const item of reports) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.subtitleId.tvShowId));
        const tvShow = response.data;
        item.subtitleId.tvShowTitle = tvShow.name;
    }
    res.json(result);
}));
exports.getPendingSubtitleReports = getPendingSubtitleReports;
// @desc get all approved subtitle reports
// @route PATCH /subtitles/reports/approved
// @access Admin
const getApprovedSubtitleReports = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const options = {
        page: pageNumber,
        limit: pageSize,
        sort: { updatedAt: -1 },
        populate: [{ path: 'userId', select: '_id username isAdmin reputation' }],
        lean: true,
    };
    const result = yield subtitleReport_1.default.paginate({ status: reportStatus_1.ReportStatus.Approved }, options);
    res.json(result);
}));
exports.getApprovedSubtitleReports = getApprovedSubtitleReports;
// @desc get all rejected subtitle reports
// @route PATCH /subtitles/reports/rejected
// @access Admin
const getRejectedSubtitleReports = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageNumber = Number(req.query.page) || 1;
    const options = {
        page: pageNumber,
        limit: pageSize,
        sort: { updatedAt: -1 },
        populate: [
            {
                path: 'subtitleId',
                select: '-thankedBy',
                populate: {
                    path: 'userId',
                    select: '_id username isAdmin reputation',
                },
            },
            { path: 'userId', select: '_id username isAdmin reputation' },
        ],
        lean: true,
    };
    const result = yield subtitleReport_1.default.paginate({ status: reportStatus_1.ReportStatus.Rejected }, options);
    const reports = result.docs;
    for (const item of reports) {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowDetailsUrl)(item.subtitleId.tvShowId));
        const tvShow = response.data;
        item.subtitleId.tvShowTitle = tvShow.name;
    }
    res.json(result);
}));
exports.getRejectedSubtitleReports = getRejectedSubtitleReports;
// @desc report subtitle
// @route PATCH /subtitles/report/:subtitleId
// @access Private
const reportSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const userId = (_g = req.user) === null || _g === void 0 ? void 0 : _g._id;
    const subtitleId = req.params.subtitleId;
    const report = req.body;
    const subtitle = yield subtitle_1.default.findById(subtitleId).populate('userId');
    if (!subtitle)
        throw new errorMiddleware_1.CustomError('Subtitle not found', 404);
    if (subtitle.userId._id.equals(userId))
        throw new errorMiddleware_1.CustomError("You can't report your own subtitle", 409);
    const uploader = subtitle.userId;
    if (uploader.isAdmin)
        throw new errorMiddleware_1.CustomError("You can't report an official subtitle", 409);
    if (subtitle.isConfirmed)
        throw new errorMiddleware_1.CustomError("You can't report a confirmed subtitle", 409);
    const foundReport = yield subtitleReport_1.default.findOne({
        userId,
        subtitleId,
    });
    if (foundReport)
        throw new errorMiddleware_1.CustomError('You have already reported this subtitle', 409);
    const insertedReport = yield subtitleReport_1.default.create({
        userId,
        subtitleId,
        reason: report.reason,
    });
    res.status(201).json(insertedReport);
}));
exports.reportSubtitle = reportSubtitle;
// @desc approve report
// @route PATCH /subtitles/report/approve/:reportId
// @access Admin
const approveSubtitleReport = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reportId = req.params.reportId;
    const report = yield subtitleReport_1.default.findById(reportId);
    if (!report)
        throw new errorMiddleware_1.CustomError('Report not found', 404);
    if (report.status !== reportStatus_1.ReportStatus.Pending)
        throw new errorMiddleware_1.CustomError('This report has already been handled', 409);
    const subtitle = yield subtitle_1.default.findById(report.subtitleId);
    if (subtitle) {
        if (subtitle.subtitleRequestId) {
            const subtitleRequest = yield subtitleRequest_1.default.findById(subtitle.subtitleRequestId);
            if (subtitleRequest) {
                subtitleRequest.subtitleId = null;
                subtitleRequest.save();
            }
        }
        yield subtitle.deleteOne();
    }
    report.status = reportStatus_1.ReportStatus.Approved;
    yield report.save();
    res.json('Success');
}));
exports.approveSubtitleReport = approveSubtitleReport;
// @desc reject report
// @route PATCH /subtitles/report/approve/:reportId
// @access Admin
const rejectSubtitleReport = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reportId = req.params.reportId;
    const report = yield subtitleReport_1.default.findById(reportId);
    if (!report)
        throw new errorMiddleware_1.CustomError('Report not found', 404);
    if (report.status !== reportStatus_1.ReportStatus.Pending)
        throw new errorMiddleware_1.CustomError('This report has already been handled', 409);
    report.status = reportStatus_1.ReportStatus.Rejected;
    yield report.save();
    res.json('Report rejected');
}));
exports.rejectSubtitleReport = rejectSubtitleReport;
// @desc add subtite request
// @route POST /subtitles/requests
// @access Public
const addSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    const user = req.user;
    const subtitleRequest = req.body;
    const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(subtitleRequest.tvShowId, subtitleRequest.season, subtitleRequest.episode));
    const episodeDetails = response.data;
    subtitleRequest.userId = user._id;
    subtitleRequest.episodeId = episodeDetails.id;
    subtitleRequest.comment = ((_h = subtitleRequest.comment) === null || _h === void 0 ? void 0 : _h.trim()) || null;
    const insertedSubtitleRequest = yield subtitleRequest_1.default.create(subtitleRequest);
    res.status(201).json(insertedSubtitleRequest);
}));
exports.addSubtitleRequest = addSubtitleRequest;
// @desc get all subtitle requests for a specific episode
// @route GET /subtitles/requests/:episodeId
// @access Public
const getSubtitleRequestsForEpisode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const userId = (_j = req.user) === null || _j === void 0 ? void 0 : _j._id;
    const episodeId = Number(req.params.episodeId);
    if (!episodeId)
        throw new errorMiddleware_1.CustomError('Invalid parameter', 400);
    const subtitleRequests = yield subtitleRequest_1.default.aggregate([
        {
            $match: { episodeId },
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
            $unwind: {
                path: '$subtitle.user',
                preserveNullAndEmptyArrays: true,
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
                'subtitle.updatedAt': 0,
                'subtitle.createdAt': 0,
                'subtitle.tvShowId': 0,
                'subtitle.season': 0,
                'subtitle.episode': 0,
                'subtitle.episodeId': 0,
                'subtitle.language': 0,
                'subtitle.frameRate': 0,
                'subtitle.onlyForeignLanguage': 0,
                'subtitle.release': 0,
                'subtitle.downloads': 0,
                'subtitle.thankedBy': 0,
                'subtitle.subtitleRequestId': 0,
                'subtitle.forHearingImpaired': 0,
            },
        },
        {
            $addFields: {
                isOwner: {
                    $eq: ['$userId', userId],
                },
                subtitle: {
                    $cond: {
                        if: { $eq: ['$subtitle', {}] },
                        then: null,
                        else: '$subtitle',
                    },
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
// @desc reopen a subtitle request
// @route PATCH /subtitles/requests/reopen/:requestId
// @access Private
const reopenSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    const userId = (_k = req.user) === null || _k === void 0 ? void 0 : _k._id;
    const requestId = req.params.requestId;
    const subtitleRequest = yield subtitleRequest_1.default.findById(requestId);
    if (!subtitleRequest)
        throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
    if (!subtitleRequest.userId.equals(userId))
        throw new errorMiddleware_1.CustomError('Not authorized', 403);
    if (!subtitleRequest.subtitleId)
        throw new errorMiddleware_1.CustomError("Can't reopen an already opened request", 409);
    const relatedSubtitle = yield subtitle_1.default.findById(subtitleRequest.subtitleId);
    if (relatedSubtitle) {
        relatedSubtitle.subtitleRequestId = null;
        yield relatedSubtitle.save();
    }
    subtitleRequest.subtitleId = null;
    yield subtitleRequest.save();
    res.json('Reopened subtitle request');
}));
exports.reopenSubtitleRequest = reopenSubtitleRequest;
// @desc delete a subtitle request
// @route DELETE /subtitles/requests/:requestId
// @access Private
const deleteSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m;
    const userId = (_l = req.user) === null || _l === void 0 ? void 0 : _l._id;
    const isAdmin = (_m = req.user) === null || _m === void 0 ? void 0 : _m.isAdmin;
    const requestId = req.params.requestId;
    const subtitleRequest = yield subtitleRequest_1.default.findById(requestId);
    if (!subtitleRequest)
        throw new errorMiddleware_1.CustomError('Subtitle request not found', 404);
    if (!subtitleRequest.userId.equals(userId) && !isAdmin)
        throw new errorMiddleware_1.CustomError('Not authorized', 403);
    if (subtitleRequest.subtitleId) {
        const relatedSubtitle = yield subtitle_1.default.findById(subtitleRequest.subtitleId);
        if (relatedSubtitle) {
            relatedSubtitle.subtitleRequestId = null;
            yield relatedSubtitle.save();
        }
    }
    yield subtitleRequest.deleteOne();
    res.json('Removed subtitle request');
}));
exports.deleteSubtitleRequest = deleteSubtitleRequest;
