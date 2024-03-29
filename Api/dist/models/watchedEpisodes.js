"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const watchedEpisodeSchema = new mongoose_1.Schema({
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
    },
}, {
    timestamps: true,
});
watchedEpisodeSchema.index({ userId: 1, tvShowId: 1 });
watchedEpisodeSchema.index({ userId: 1, episodeId: 1 });
const WatchedEpisode = (0, mongoose_1.model)('WatchedEpisode', watchedEpisodeSchema);
exports.default = WatchedEpisode;
