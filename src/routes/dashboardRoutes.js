import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getSummary, getTrends } from '../controllers/dashboardController.js';

const router = Router();

/** All dashboard endpoints require a valid JWT (Bearer header or `token` cookie). */
router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/trends', getTrends);

export default router;
