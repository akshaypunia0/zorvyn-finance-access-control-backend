import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../config/db.js';
import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers?.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User no longer exists' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive. Contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

export default authMiddleware;
