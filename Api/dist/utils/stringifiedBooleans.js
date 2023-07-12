"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifiedBooleanToBoolean = void 0;
const trueStringified = 'true';
const stringifiedBooleanToBoolean = (val) => val.toLowerCase() === trueStringified;
exports.stringifiedBooleanToBoolean = stringifiedBooleanToBoolean;
