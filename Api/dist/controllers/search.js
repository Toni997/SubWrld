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
exports.searchTVShows = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const axios_1 = __importDefault(require("axios"));
const tmdb_api_1 = require("../utils/tmdb-api");
const maxNumberOfResults = 5;
// @desc Search TV Shows that include keyword
// @route POST /search?keword=
// @access Public
const searchTVShows = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const keyword = (_a = req.query.keyword) === null || _a === void 0 ? void 0 : _a.toString();
    if (!keyword || keyword.trim().length < 1) {
        throw new Error('Search keyword should be at least 1 character long');
    }
    try {
        const url = (0, tmdb_api_1.getSearchTVShowUrl)(keyword);
        const showsResponse = yield axios_1.default.get(url);
        let shows = showsResponse.data.results;
        const genresResponse = yield axios_1.default.get(tmdb_api_1.genresUrl);
        const genres = genresResponse.data.genres;
        const genresObject = genres.reduce((a, v) => (Object.assign(Object.assign({}, a), { [v.id]: v.name })), {});
        shows.forEach((show) => {
            const genreNames = show.genre_ids.map((id) => genresObject[id]);
            console.log(genreNames);
            show.genre_names = genreNames;
            console.log(show);
        });
        res.json(shows.slice(0, maxNumberOfResults));
    }
    catch (error) {
        throw new Error(error.message || 'Error with TMBD API');
    }
}));
exports.searchTVShows = searchTVShows;
