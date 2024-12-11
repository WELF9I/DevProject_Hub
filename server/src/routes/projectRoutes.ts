import express from 'express';
import { getAllProjects, createProject, searchProjects, updateProjectsEngagement, getTopProjects} from '../controllers/projectController';
import { extractSearchCriteria } from '../controllers/aiController';

const router = express.Router();

router.get('/', getAllProjects);
router.post('/', createProject);
router.post('/search', searchProjects);
router.post('/extract-search-criteria', extractSearchCriteria);
router.post('/update-engagement', updateProjectsEngagement);
router.get('/top-projects', getTopProjects);

export default router;
