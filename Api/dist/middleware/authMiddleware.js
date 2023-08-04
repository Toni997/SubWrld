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
exports.requireAdminRights = exports.passUserToRequest = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = __importDefault(require("../models/user"));
const errorMiddleware_1 = require("./errorMiddleware");
const authenticate = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')) {
        throw new errorMiddleware_1.CustomError('Not authorized', 401);
    }
    const token = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        throw new errorMiddleware_1.CustomError('Not authorized', 401);
    }
    req.user = (yield user_1.default.findById(decoded._id).select('-password'));
    next();
}));
exports.authenticate = authenticate;
const passUserToRequest = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = (yield user_1.default.findById(decoded._id).select('-password'));
        }
        catch (error) {
            console.error(error);
        }
    }
    next();
}));
exports.passUserToRequest = passUserToRequest;
const requireAdminRights = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')) {
        throw new errorMiddleware_1.CustomError('Not authorized', 401);
    }
    const token = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        throw new errorMiddleware_1.CustomError('Not authorized', 401);
    }
    req.user = (yield user_1.default.findById(decoded._id).select('-password'));
    if (!req.user.isAdmin)
        throw new errorMiddleware_1.CustomError('Admin rights required to perform this action', 403);
    next();
}));
exports.requireAdminRights = requireAdminRights;
