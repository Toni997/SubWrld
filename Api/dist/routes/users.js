"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_ts_1 = require("../controllers/user.ts");
const authMiddleware_ts_1 = require("../middleware/authMiddleware.ts");
const router = express_1.default.Router();
router.route('/').post(user_ts_1.registerUser);
router.post('/login', user_ts_1.authUser);
router
    .route('/profile')
    .get(authMiddleware_ts_1.authenticate, user_ts_1.getUserProfile)
    .put(authMiddleware_ts_1.authenticate, user_ts_1.updateUserProfile);
exports.default = router;
