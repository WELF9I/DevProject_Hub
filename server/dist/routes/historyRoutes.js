"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const historyController_1 = require("../controllers/historyController");
const router = express_1.default.Router();
router.post('/add/:clerk_id/:project_id', historyController_1.addHistory);
router.get('/:clerk_id', historyController_1.getUserHistory);
router.delete('/:clerk_id', historyController_1.deleteAllUserHistory);
router.delete('/:clerk_id/:project_id', historyController_1.deleteProjectFromHistory);
exports.default = router;
