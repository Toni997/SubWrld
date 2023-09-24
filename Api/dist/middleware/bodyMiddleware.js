"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const errorMiddleware_1 = require("./errorMiddleware");
const validateBody = (validator) => (req, res, next) => {
    console.log('IS IT valid123');
    const { error } = validator.validate(req.body);
    if (error)
        throw new errorMiddleware_1.CustomError(error.details[0].message, 400);
    console.log('it is valid123');
    next();
};
exports.validateBody = validateBody;
