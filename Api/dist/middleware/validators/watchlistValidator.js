"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWatchlistValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const removeFromWatchlistValidator = joi_1.default.object({
    tvShowIds: joi_1.default.array().min(1).items(joi_1.default.number().positive()).required(),
});
exports.removeFromWatchlistValidator = removeFromWatchlistValidator;
