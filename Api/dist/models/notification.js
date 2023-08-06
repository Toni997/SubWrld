"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
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
notificationSchema.plugin(mongoose_paginate_v2_1.default);
const Notification = (0, mongoose_1.model)('Notification', notificationSchema);
exports.default = Notification;
