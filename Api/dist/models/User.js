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
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
        validate: {
            validator: (v) => {
                const re = /^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
                return !v || !v.trim().length || re.test(v);
            },
            message: 'Username not valid',
        },
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true,
        validate: {
            validator: (v) => {
                const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
                return !v || !v.trim().length || re.test(v);
            },
            message: 'Email not valid',
        },
    },
    password: {
        type: String,
        required: true,
        minLength: [6, 'Password too short'],
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    reputation: {
        type: Number,
        required: true,
        default: 0,
    },
    darkMode: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true,
});
userSchema.methods.matchPassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(enteredPassword, this.password);
    });
};
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            next();
        const salt = yield bcryptjs_1.default.genSalt(10);
        this.password = yield bcryptjs_1.default.hash(this.password, salt);
    });
});
userSchema.plugin(mongoose_paginate_v2_1.default);
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
