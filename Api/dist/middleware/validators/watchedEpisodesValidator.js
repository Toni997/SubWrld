"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markWatchedEpisodesValidator = exports.markWatchedValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const markWatchedValidator = joi_1.default.object({
    tvShowId: joi_1.default.number().positive().required(),
    watched: joi_1.default.array().min(1).required(),
});
exports.markWatchedValidator = markWatchedValidator;
const markWatchedEpisodesValidator = joi_1.default.object({
    season: joi_1.default.number().integer().min(0).required(),
    episodes: joi_1.default.alternatives()
        .try(joi_1.default.number().integer().positive().allow(null), joi_1.default.array()
        .length(2)
        .ordered(joi_1.default.number().integer().positive(), joi_1.default.number()
        .integer()
        .positive()
        .greater(joi_1.default.ref('0'))
        .message('Second value should be greater than first in episodes range')))
        .required(),
});
exports.markWatchedEpisodesValidator = markWatchedEpisodesValidator;
