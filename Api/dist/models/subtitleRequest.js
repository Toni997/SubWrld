"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const subtitleRequestSchema = new mongoose_1.Schema({
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
    preferredLanguage: {
        type: String,
        required: true,
    },
    preferredFrameRate: {
        type: Number,
        default: null,
    },
    subtitleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subtitle',
        default: null,
    },
    preferForHearingImpaired: {
        type: Boolean,
        required: true,
        default: false,
    },
    comment: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
const SubtitleRequest = (0, mongoose_1.model)('SubtitleRequest', subtitleRequestSchema);
exports.default = SubtitleRequest;
