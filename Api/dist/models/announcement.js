"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_aggregate_paginate_v2_1 = __importDefault(require("mongoose-aggregate-paginate-v2"));
const announcementSchema = new mongoose_1.Schema({
    tvShowId: {
        type: Number,
        required: true,
        index: true,
    },
    text: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
announcementSchema.plugin(mongoose_paginate_v2_1.default);
announcementSchema.plugin(mongoose_aggregate_paginate_v2_1.default);
const Announcement = (0, mongoose_1.model)('Announcement', announcementSchema);
exports.default = Announcement;
