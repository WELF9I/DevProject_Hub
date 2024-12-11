import express from 'express';
import { getPopularTagsByEngagement, } from '../controllers/chartController';

const router = express.Router();

router.get('/tags-engagement', getPopularTagsByEngagement);

export default router;