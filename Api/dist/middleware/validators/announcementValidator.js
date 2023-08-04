"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementUpdateValidator = exports.announcementCreateValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const announcementCreateValidator = joi_1.default.object({
    tvShowId: joi_1.default.number().positive().required(),
    text: joi_1.default.string().min(10).max(500).trim().strict(true).required(),
});
exports.announcementCreateValidator = announcementCreateValidator;
const announcementUpdateValidator = joi_1.default.object({
    text: joi_1.default.string().min(10).max(500).trim().strict(true).required(),
});
exports.announcementUpdateValidator = announcementUpdateValidator;
