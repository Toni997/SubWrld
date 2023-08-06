"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const subtitleSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    tvShowId: {
        type: Number,
        required: true,
    },
    season: {
        type: Number,
        required: true,
    },
    episode: {
        type: Number,
        required: true,
    },
    episodeId: {
        type: Number,
        required: true,
        index: true,
    },
    language: {
        type: String,
        required: true,
    },
    frameRate: {
        type: Number,
        required: true,
        default: null,
    },
    subtitleRequestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SubtitleRequest',
        default: null,
    },
    isWorkInProgress: {
        type: Boolean,
        required: true,
        default: false,
    },
    forHearingImpaired: {
        type: Boolean,
        required: true,
        default: false,
    },
    onlyForeignLanguage: {
        type: Boolean,
        required: true,
        default: false,
    },
    release: {
        type: String,
        required: true,
    },
    filePath: {
        type: String,
        default: null,
    },
    downloads: {
        type: Number,
        required: true,
        default: 0,
    },
    uploaderIsAuthor: {
        type: Boolean,
        required: true,
        default: false,
    },
    isConfirmed: {
        type: Boolean,
        required: true,
        default: false,
    },
    thankedBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
}, {
    timestamps: true,
});
subtitleSchema.virtual('thankedByCount').get(function () {
    return this.thankedBy.length;
});
subtitleSchema.plugin(mongoose_paginate_v2_1.default);
const Subtitle = (0, mongoose_1.model)('Subtitle', subtitleSchema);
exports.default = Subtitle;
