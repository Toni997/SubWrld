"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode || 500;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    var _a;
    const statusCode = err.statusCode ||
        ((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) ||
        (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode);
    res.json({
        message: err.message || 'Error occurred',
        stack: process.env.NODE_ENV === 'prod' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
