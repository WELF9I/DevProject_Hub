"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chartController_1 = require("../controllers/chartController");
const router = express_1.default.Router();
router.get('/tags-engagement', chartController_1.getPopularTagsByEngagement);
exports.default = router;
