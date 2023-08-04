"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subtitleReportValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const subtitleReportValidator = joi_1.default.object({
    reason: joi_1.default.string().min(10).max(300).trim().strict(true).required(),
});
exports.subtitleReportValidator = subtitleReportValidator;
