import express from 'express';
import { createBookmark, deleteBookmark,getUserBookmarks ,checkProjectBookmark} from '../controllers/bookmarkController';

const router = express.Router();

router.post('/', createBookmark);
router.delete('/', deleteBookmark);
router.get('/:clerk_id', getUserBookmarks);
router.get('/check', checkProjectBookmark);

export default router;