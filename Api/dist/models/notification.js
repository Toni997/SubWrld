"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
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
const Notification = (0, mongoose_1.model)('Notification', notificationSchema);
exports.default = Notification;
