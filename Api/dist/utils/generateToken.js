"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        darkMode: user.darkMode,
    }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};
exports.default = generateToken;
