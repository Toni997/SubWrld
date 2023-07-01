"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.subtitlesFolderPath = exports.tempFolderPath = void 0;
const multer_1 = __importDefault(require("multer"));
const subtitleValidator_1 = require("../middleware/validators/subtitleValidator");
const uuid_1 = require("uuid");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fileSizeLimitMegabytes = 1;
exports.tempFolderPath = path_1.default.join('uploads', 'temp');
exports.subtitlesFolderPath = path_1.default.join('uploads', 'subtitles');
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (!fs_1.default.existsSync(exports.tempFolderPath)) {
            fs_1.default.mkdirSync(exports.tempFolderPath);
        }
        cb(null, exports.tempFolderPath);
    },
    filename: (req, file, cb) => {
        cb(null, (0, uuid_1.v4)() + '.' + file.originalname.split('.').pop());
    },
});
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.srt', '.sub', '.ssa', '.ass', '.vtt'];
    const allowedMimeTypes = [
        'application/x-subrip',
        'application/x-matroska',
        'application/vnd.ms-ssa',
        'application/vnd.nikse.subtitleeditor',
        'text/plain',
    ];
    const fileExtension = '.' + file.originalname.split('.').pop();
    const mimeType = file.mimetype;
    if (allowedExtensions.includes(fileExtension) &&
        allowedMimeTypes.includes(mimeType)) {
        const { error } = subtitleValidator_1.subtitleValidator.validate(req.body);
        if (!error) {
            req.statusCode = 400;
            cb(null, true);
        }
        else {
            cb(new errorMiddleware_1.CustomError(error.details[0].message, 400));
        }
    }
    else {
        cb(new errorMiddleware_1.CustomError('Unsupported files', 415));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: fileSizeLimitMegabytes * 1024 * 1024,
    },
    fileFilter: fileFilter,
});
exports.upload = upload;
