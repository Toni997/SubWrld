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
exports.subtitleMulter = exports.subtitlesFolderPath = exports.tempFolderPath = exports.allowedMimeTypes = exports.allowedExtensions = void 0;
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fileSizeLimitMegabytes = 2;
exports.allowedExtensions = ['.srt', '.sub', '.ssa', '.ass', '.vtt'];
exports.allowedMimeTypes = [
    'application/x-subrip',
    'application/x-matroska',
    'application/vnd.ms-ssa',
    'application/vnd.nikse.subtitleeditor',
    'text/plain',
];
exports.tempFolderPath = path_1.default.join('uploads', 'temp');
exports.subtitlesFolderPath = path_1.default.join('uploads', 'subtitles');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (!fs_1.default.existsSync(exports.tempFolderPath))
            fs_1.default.mkdirSync(exports.tempFolderPath);
        cb(null, exports.tempFolderPath);
    },
    filename: (req, file, cb) => {
        cb(null, (0, uuid_1.v4)() + '.' + file.originalname.split('.').pop());
    },
});
const fileFilter = (req, file, cb) => __awaiter(void 0, void 0, void 0, function* () {
    const extension = '.' + file.originalname.split('.').pop();
    if (exports.allowedExtensions.includes(extension)) {
        cb(null, true);
    }
    else {
        cb(new errorMiddleware_1.CustomError('Unsupported files', 415));
    }
});
const subtitleMulter = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: fileSizeLimitMegabytes * 1024 * 1024,
    },
    fileFilter,
});
exports.subtitleMulter = subtitleMulter;
