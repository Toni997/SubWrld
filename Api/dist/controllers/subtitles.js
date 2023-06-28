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
exports.addSubtitle = exports.deleteSubtitleRequest = exports.getSubtitleRequestsForEpisode = exports.addSubtitleRequest = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const subtitleRequest_1 = __importDefault(require("../models/subtitleRequest"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const addSubtitle = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.file) {
        res.status(400);
        throw new Error('File not supported');
    }
    const user = req.user;
    const subtitle = req.body;
    const files = req.files;
    try {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(subtitle.tvShowId, subtitle.season, subtitle.episode));
        const episodeDetails = response.data;
        subtitle.userId = user._id;
        subtitle.episodeId = episodeDetails.id;
        subtitle.release = subtitle.release.trim();
        /*const zipFileName = uuidv4()
        const output = fs.createWriteStream(zipFileName + '.zip')
  
        const archive = archiver('zip', {
          zlib: { level: 9 }, // Set compression level (optional)
        });
      
        // Pipe the archive stream to the output stream
        archive.pipe(output);
  
        const insertedSubtitleRequest = await Subtitle.create(subtitle)*/
        res.status(201).json(subtitle);
    }
    catch (error) {
        res.status(((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500);
        throw new Error(error.message || 'Error with TMBD API');
    }
}));
exports.addSubtitle = addSubtitle;
const addSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const user = req.user;
    const subtitleRequest = req.body;
    try {
        const response = yield axios_1.default.get((0, tmdb_api_1.getTVShowEpisodeDetailsUrl)(subtitleRequest.tvShowId, subtitleRequest.season, subtitleRequest.episode));
        const episodeDetails = response.data;
        subtitleRequest.userId = user._id;
        subtitleRequest.episodeId = episodeDetails.id;
        subtitleRequest.comment = ((_b = subtitleRequest.comment) === null || _b === void 0 ? void 0 : _b.trim()) || null;
        const insertedSubtitleRequest = yield subtitleRequest_1.default.create(subtitleRequest);
        res.status(201).json(insertedSubtitleRequest);
    }
    catch (error) {
        res.status(((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) || 500);
        throw new Error(error.message || 'Error with TMBD API');
    }
}));
exports.addSubtitleRequest = addSubtitleRequest;
const getSubtitleRequestsForEpisode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
    const episodeId = Number(req.params.episodeId);
    if (!episodeId) {
        res.status(400);
        throw new Error('Invalid parameter');
    }
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
const deleteSubtitleRequest = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
    const isAdmin = (_f = req.user) === null || _f === void 0 ? void 0 : _f.isAdmin;
    const requestId = req.params.requestId;
    const subtitleRequest = yield subtitleRequest_1.default.findOne({ _id: requestId });
    if (!subtitleRequest) {
        res.status(404);
        throw new Error('Subtitle request not found');
    }
    if (subtitleRequest.userId !== userId && !isAdmin) {
        res.status(401);
        throw new Error('Not authorized');
    }
    yield subtitleRequest.deleteOne();
    res.json('Removed subtitle request');
}));
exports.deleteSubtitleRequest = deleteSubtitleRequest;
