"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const favoriteSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tvShowId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TVShow',
        required: true,
    },
    // Add any additional fields specific to the favorite
}, {
    timestamps: true,
});
