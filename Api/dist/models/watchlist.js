"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const watchlistSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    tvShowId: {
        type: Number,
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});
const Watchlist = (0, mongoose_1.model)('Watchlist', watchlistSchema);
exports.default = Watchlist;
