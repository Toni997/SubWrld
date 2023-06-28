"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const mongo_1 = __importDefault(require("./config/mongo"));
const index_1 = __importDefault(require("./routes/index"));
const users_1 = __importDefault(require("./routes/users"));
const tv_shows_1 = __importDefault(require("./routes/tv-shows"));
const subtitles_1 = __importDefault(require("./routes/subtitles"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
dotenv_1.default.config();
(0, mongo_1.default)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: 'http://localhost:9000',
}));
app.use('/', index_1.default);
app.use('/users', users_1.default);
app.use('/tv-shows', tv_shows_1.default);
app.use('/subtitles', subtitles_1.default);
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
