import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';

const USER_SELECT_PUBLIC = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT_PUBLIC,
      }),
      prisma.user.count(),
    ]);

    return res.json({
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list users', details: e.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: USER_SELECT_PUBLIC,
    });
    if (!user) {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }
    return res.json({ data: user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get user', details: e.message });
  }
};

const VALID_ROLES = new Set(['VIEWER', 'ANALYST', 'ADMIN']);
const VALID_STATUS = new Set(['ACTIVE', 'INACTIVE']);

export const createUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, role, status } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'fullName, email, and password are required',
      });
    }

    if (role && !VALID_ROLES.has(role)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `role must be one of: ${[...VALID_ROLES].join(', ')}`,
      });
    }

    if (status && !VALID_STATUS.has(status)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `status must be one of: ${[...VALID_STATUS].join(', ')}`,
      });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone: phone ?? null,
        password: hash,
        role: role ?? 'VIEWER',
        status: status ?? 'ACTIVE',
      },
      select: USER_SELECT_PUBLIC,
    });

    return res.status(201).json({ message: 'User created', data: user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create user', details: e.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { fullName, phone, role, status, password } = req.body;
    const data = {};

    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) {
      if (!VALID_ROLES.has(role)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: `role must be one of: ${[...VALID_ROLES].join(', ')}`,
        });
      }
      data.role = role;
    }
    if (status !== undefined) {
      if (!VALID_STATUS.has(status)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: `status must be one of: ${[...VALID_STATUS].join(', ')}`,
        });
      }
      data.status = status;
    }
    if (password !== undefined && password !== '') {
      data.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Validation failed', message: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: USER_SELECT_PUBLIC,
    });

    return res.json({ message: 'User updated', data: user });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }
    return res.status(500).json({ error: 'Failed to update user', details: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Bad request', message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }
    if (e.code === 'P2003') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete user who owns financial records. Deactivate the account instead.',
      });
    }
    return res.status(500).json({ error: 'Failed to delete user', details: e.message });
  }
};
