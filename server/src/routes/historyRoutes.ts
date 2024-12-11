import express from 'express';
import { addHistory, getUserHistory, deleteAllUserHistory, deleteProjectFromHistory } from '../controllers/historyController';

const router = express.Router();

router.post('/add/:clerk_id/:project_id', addHistory);
router.get('/:clerk_id', getUserHistory);
router.delete('/:clerk_id', deleteAllUserHistory);
router.delete('/:clerk_id/:project_id', deleteProjectFromHistory); 

export default router;