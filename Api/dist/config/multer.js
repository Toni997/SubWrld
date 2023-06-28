"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const subtitleValidator_1 = require("../middleware/validators/subtitleValidator");
const fileSizeLimitMegabytes = 1;
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
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
            cb(null, true);
        }
        else {
            cb(new Error(error.details[0].message));
        }
    }
    else {
        cb(null, false);
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
