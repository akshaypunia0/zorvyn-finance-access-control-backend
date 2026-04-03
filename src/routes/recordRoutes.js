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

router.use(authMiddleware);

router.get('/', requireRoles(ROLES.ANALYST, ROLES.ADMIN), listRecords);
router.get('/:id', requireRoles(ROLES.ANALYST, ROLES.ADMIN), getRecord);

router.post('/', requireRoles(ROLES.ADMIN), createRecord);
router.patch('/:id', requireRoles(ROLES.ADMIN), updateRecord);
router.delete('/:id', requireRoles(ROLES.ADMIN), deleteRecord);

export default router;
