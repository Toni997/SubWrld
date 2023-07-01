"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subtitleValidator = void 0;
const countries_list_1 = require("countries-list");
const joi_1 = __importDefault(require("@hapi/joi"));
const subtitleValidator = joi_1.default.object({
    tvShowId: joi_1.default.number().integer().positive().required(),
    season: joi_1.default.number().integer().min(0).required(),
    episode: joi_1.default.number().integer().positive().required(),
    language: joi_1.default.string()
        .length(2)
        .custom((value, helpers) => {
        if (!countries_list_1.languages.hasOwnProperty(value)) {
            return helpers.error('language.invalid');
        }
        return value;
    }, 'validate language code')
        .message('language is not a valid language code')
        .required(),
    frameRate: joi_1.default.number().precision(3).min(23.976).max(60).required(),
    forHearingImpaired: joi_1.default.boolean().required(),
    release: joi_1.default.string()
        .max(50)
        .min(3)
        .regex(/^(?![-.])(?!.*--)(?!.*\.\.)(?!.*[-.]$)[a-zA-Z0-9.-]+$/)
        .message('release can only contain letters, numbers, - and . (no consecutive - or . nor at the beginning or the end)')
        .required(),
    subtitleRequestId: joi_1.default.string().allow(null),
    isWorkInProgress: joi_1.default.boolean().required(),
    onlyForeignLanguage: joi_1.default.boolean().required(),
    uploaderIsAuthor: joi_1.default.boolean().required(),
});
exports.subtitleValidator = subtitleValidator;
