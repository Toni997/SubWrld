"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const watchedEpisodesValidator = joi_1.default.object({
    season: joi_1.default.number().integer().positive().required(),
    episodes: joi_1.default.alternatives()
        .try(joi_1.default.number().integer().positive(), joi_1.default.array()
        .length(2)
        .ordered(joi_1.default.number().integer().positive(), joi_1.default.number().integer().positive().greater(joi_1.default.ref('0'))), joi_1.default.allow(null))
        .required(),
});
exports.default = watchedEpisodesValidator;
