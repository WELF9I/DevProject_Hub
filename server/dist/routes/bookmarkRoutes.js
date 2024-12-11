"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookmarkController_1 = require("../controllers/bookmarkController");
const router = express_1.default.Router();
router.post('/', bookmarkController_1.createBookmark);
router.delete('/', bookmarkController_1.deleteBookmark);
router.get('/:clerk_id', bookmarkController_1.getUserBookmarks);
router.get('/check', bookmarkController_1.checkProjectBookmark);
exports.default = router;
