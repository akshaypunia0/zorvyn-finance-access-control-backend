import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/recordController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial record management (RBAC-protected)
 */

router.use(authMiddleware);

router.get('/', requireRoles(ROLES.ANALYST, ROLES.ADMIN), listRecords);
router.get('/:id', requireRoles(ROLES.ANALYST, ROLES.ADMIN), getRecord);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Records]
 *     description: >
 *       Creates a new income or expense record.
 *       **Required role:** `ADMIN` only.
 *       The record is automatically linked to the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecordRequest'
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Record created
 *                 data:
 *                   $ref: '#/components/schemas/FinancialRecord'
 *       400:
 *         description: Validation failed — missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — insufficient role (requires ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', requireRoles(ROLES.ADMIN), createRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   patch:
 *     summary: Update a financial record
 *     tags: [Records]
 *     description: >
 *       Partially updates an existing financial record (only non-deleted records).
 *       **Required role:** `ADMIN` only.
 *       Send only the fields you want to change.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRecordRequest'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Record updated
 *                 data:
 *                   $ref: '#/components/schemas/FinancialRecord'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — insufficient role (requires ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Record not found or already deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id', requireRoles(ROLES.ADMIN), updateRecord);

router.delete('/:id', requireRoles(ROLES.ADMIN), deleteRecord);

export default router;

