"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reportStatus_1 = require("../utils/reportStatus");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const subtitleReportSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    subtitleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subtitle',
        required: true,
        index: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        enum: reportStatus_1.ReportStatus,
        default: reportStatus_1.ReportStatus.Pending,
        required: true,
    },
}, {
    timestamps: true,
});
subtitleReportSchema.index({ userId: 1, subtitleId: 1 });
subtitleReportSchema.plugin(mongoose_paginate_v2_1.default);
const SubtitleReport = (0, mongoose_1.model)('SubtitleReport', subtitleReportSchema);
exports.default = SubtitleReport;
