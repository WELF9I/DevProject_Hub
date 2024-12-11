"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const aiController_1 = require("../controllers/aiController");
const router = express_1.default.Router();
router.get('/', projectController_1.getAllProjects);
router.post('/', projectController_1.createProject);
router.post('/search', projectController_1.searchProjects);
router.post('/extract-search-criteria', aiController_1.extractSearchCriteria);
router.post('/update-engagement', projectController_1.updateProjectsEngagement);
router.get('/top-projects', projectController_1.getTopProjects);
exports.default = router;
