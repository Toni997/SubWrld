"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.popularTVShowsUrl = exports.genresUrl = exports.getSearchTVShowUrl = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const baseUrl = 'https://api.themoviedb.org/3';
const TMBD_API_KEY = process.env.TMDB_API;
console.log(TMBD_API_KEY);
const getSearchTVShowUrl = (keyword) => `${baseUrl}/search/tv?api_key=${TMBD_API_KEY}&language=en-US&page=1&include_adult=false&query=${keyword}`;
exports.getSearchTVShowUrl = getSearchTVShowUrl;
exports.genresUrl = `${baseUrl}/genre/tv/list?api_key=${TMBD_API_KEY}&language=en-US`;
exports.popularTVShowsUrl = `${baseUrl}/tv/popular?api_key=${TMBD_API_KEY}&language=en-US`;
