"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStringifiedBoolean = void 0;
const trueStringified = 'true';
const convertStringifiedBoolean = (val) => val.toLowerCase() === trueStringified;
exports.convertStringifiedBoolean = convertStringifiedBoolean;
