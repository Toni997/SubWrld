"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedMimeTypes = exports.allowedExtensions = exports.uploadSubtitleDest = exports.formidableConfigForSubtitles = void 0;
const formidableConfigForSubtitles = {
    maxTotalFileSize: 2 * 1024 * 1024,
    maxFields: 11,
    keepExtensions: true,
    multiples: false,
};
exports.formidableConfigForSubtitles = formidableConfigForSubtitles;
const uploadDest = '/uploads';
const uploadSubtitleDest = uploadDest + '/subtitles';
exports.uploadSubtitleDest = uploadSubtitleDest;
const allowedExtensions = ['.srt', '.sub', '.ssa', '.ass', '.vtt'];
exports.allowedExtensions = allowedExtensions;
const allowedMimeTypes = [
    'application/x-subrip',
    'application/x-matroska',
    'application/vnd.ms-ssa',
    'application/vnd.nikse.subtitleeditor',
    'text/plain',
];
exports.allowedMimeTypes = allowedMimeTypes;
