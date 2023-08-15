"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const errorMiddleware_1 = require("./errorMiddleware");
const validateBody = (validator) => (req, res, next) => {
    const { error } = validator.validate(req.body);
    if (error)
        throw new errorMiddleware_1.CustomError(error.details[0].message, 400);
    next();
};
exports.validateBody = validateBody;
