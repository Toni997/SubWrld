"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMarkWatched = void 0;
const watchedEpisodesValidator_1 = require("./validators/watchedEpisodesValidator");
const validateMarkWatched = (req, res, next) => {
    const { error } = watchedEpisodesValidator_1.markWatchedValidator.validate(req.body);
    if (error)
        return res.status(400).json({ error: error.details[0].message });
    next();
};
exports.validateMarkWatched = validateMarkWatched;
