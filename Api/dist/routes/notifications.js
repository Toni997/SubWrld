"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const notifications_1 = require("../controllers/notifications");
const notificationRouter = express_1.default.Router();
notificationRouter.get('', authMiddleware_1.authenticate, notifications_1.getNotificationsForUser);
exports.default = notificationRouter;
