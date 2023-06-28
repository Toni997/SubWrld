"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSetDarkMode = exports.validateSubtitleRequest = exports.validateRemoveFromWatchlist = exports.validateMarkWatched = void 0;
const watchedEpisodesValidator_1 = require("./validators/watchedEpisodesValidator");
const watchlistValidator_1 = require("./validators/watchlistValidator");
const subtitleRequestValidator_1 = require("./validators/subtitleRequestValidator");
const setDarkModeValidator_1 = require("./validators/setDarkModeValidator");
const validateMarkWatched = (req, res, next) => {
    const { error } = watchedEpisodesValidator_1.markWatchedValidator.validate(req.body);
    if (error)
        return res.status(400).json({ error: error.details[0].message });
    next();
};
exports.validateMarkWatched = validateMarkWatched;
const validateRemoveFromWatchlist = (req, res, next) => {
    const { error } = watchlistValidator_1.removeFromWatchlistValidator.validate(req.body);
    if (error)
        return res.status(400).json({ error: error.details[0].message });
    next();
};
exports.validateRemoveFromWatchlist = validateRemoveFromWatchlist;
const validateSubtitleRequest = (req, res, next) => {
    const { error } = subtitleRequestValidator_1.subtitleRequestValidator.validate(req.body);
    if (error)
        return res.status(400).json({ error: error.details[0].message });
    next();
};
exports.validateSubtitleRequest = validateSubtitleRequest;
const validateSetDarkMode = (req, res, next) => {
    const { error } = setDarkModeValidator_1.setDarkModeValidator.validate(req.body);
    if (error)
        return res.status(400).json({ error: error.details[0].message });
    next();
};
exports.validateSetDarkMode = validateSetDarkMode;
