import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getSummary, getTrends } from '../controllers/dashboardController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated financial summaries and trends (requires authentication)
 */

/** All dashboard endpoints require a valid JWT (Bearer header or `token` cookie). */
router.use(authMiddleware);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get financial dashboard summary
 *     tags: [Dashboard]
 *     description: >
 *       Returns totals (income, expenses, net balance), category breakdown, and
 *       recent activity. Available to all authenticated roles (**VIEWER**, **ANALYST**, **ADMIN**).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601, e.g. `2025-01-01`)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601, e.g. `2025-12-31`)
 *       - in: query
 *         name: recentLimit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of recent transactions to return
 *     responses:
 *       200:
 *         description: Summary data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/summary', getSummary);

router.get('/trends', getTrends);

export default router;

