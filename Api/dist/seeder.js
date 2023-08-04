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
const dotenv_1 = __importDefault(require("dotenv"));
const users_1 = __importDefault(require("./seed/users"));
const user_1 = __importDefault(require("./models/user"));
const watchlist_1 = __importDefault(require("./models/watchlist"));
const mongo_1 = __importDefault(require("./config/mongo"));
const watchedEpisode_1 = __importDefault(require("./models/watchedEpisode"));
dotenv_1.default.config();
(0, mongo_1.default)();
const importData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield user_1.default.deleteMany();
        yield watchlist_1.default.deleteMany();
        yield watchedEpisode_1.default.deleteMany();
        yield user_1.default.insertMany(users_1.default);
        console.log('Data imported');
        process.exit();
    }
    catch (error) {
        console.log(`Error: ${error}`);
        process.exit(1);
    }
});
const destroyData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield user_1.default.deleteMany();
        yield watchlist_1.default.deleteMany();
        yield watchedEpisode_1.default.deleteMany();
        console.log('Data destroyed!');
        process.exit();
    }
    catch (error) {
        console.log(`Error: ${error}`);
        process.exit(1);
    }
});
if (process.argv[2] === '-d') {
    destroyData();
}
else {
    importData();
}
