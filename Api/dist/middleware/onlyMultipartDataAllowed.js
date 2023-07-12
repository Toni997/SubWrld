"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const onlyMultipartDataAllowed = (req, res, next) => {
    if (req.is('multipart/form-data')) {
        next();
    }
    else {
        res.status(400).json({
            error: 'Invalid request format. Only multipart/form-data is allowed.',
        });
    }
};
exports.default = onlyMultipartDataAllowed;
