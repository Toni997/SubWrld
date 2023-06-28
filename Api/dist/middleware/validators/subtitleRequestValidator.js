"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subtitleRequestValidator = void 0;
const countries_list_1 = require("countries-list");
const joi_1 = __importDefault(require("joi"));
const subtitleRequestValidator = joi_1.default.object({
    tvShowId: joi_1.default.number().integer().positive().required(),
    season: joi_1.default.number().integer().min(0).required(),
    episode: joi_1.default.number().integer().positive().required(),
    preferredLanguage: joi_1.default.string()
        .length(2)
        .custom((value, helpers) => {
        if (!countries_list_1.languages.hasOwnProperty(value)) {
            return helpers.error('preferredLanguage.invalid');
        }
        return value;
    }, 'validate language code')
        .message('preferredLanguage is not a valid language code')
        .required(),
    preferredFrameRate: joi_1.default.number().precision(3).min(23.976).max(60).allow(null),
    preferForHearingImpaired: joi_1.default.boolean().required(),
    comment: joi_1.default.string().max(100).allow(null),
});
exports.subtitleRequestValidator = subtitleRequestValidator;
