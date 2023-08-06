"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsForUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const notification_1 = __importDefault(require("../models/notification"));
const pageSize = 10;
// @desc get notifications for authenticated user
// @route GET /notifications
// @access Private
const getNotificationsForUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const pageNumber = Number(req.query.page) || 1;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const options = {
        page: pageNumber,
        limit: pageSize,
        sort: { createdAt: -1 },
        lean: true,
    };
    const result = yield notification_1.default.paginate({ userId }, options);
    res.json(result);
}));
exports.getNotificationsForUser = getNotificationsForUser;
