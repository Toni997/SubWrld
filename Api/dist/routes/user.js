"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const authMiddleware_1 = require("../middleware/authMiddleware");
const usersRouter = express_1.default.Router();
usersRouter.post('/login', user_1.loginUser);
usersRouter.post('/signup', user_1.signupUser);
usersRouter.get('/:userId', user_1.getUser);
usersRouter.put('/', authMiddleware_1.authenticate, user_1.updateUser);
exports.default = usersRouter;
