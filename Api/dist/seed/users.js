"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users = [
    {
        username: 'admin',
        email: 'admin@example.com',
        password: bcryptjs_1.default.hashSync('123456', 10),
        isAdmin: true,
    },
    {
        username: 'johndoe',
        email: 'john@example.com',
        password: bcryptjs_1.default.hashSync('123456', 10),
    },
    {
        username: 'janedoe',
        email: 'jane@example.com',
        password: bcryptjs_1.default.hashSync('123456', 10),
    },
];
exports.default = users;
