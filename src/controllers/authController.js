import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utills/generateToken.js';

const register = async (req, res) => {
  console.log("Request received for register");
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'fullName, email, and password are required',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ error: 'Conflict', message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone: phone ?? null,
        password: hashPassword,
        role: 'VIEWER',
        status: 'ACTIVE',
      },
    });

    const token = generateToken(user, res);

    return res.status(201).json({
      message: 'User registered successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Registration failed',
      details: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'email and password are required',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive. Contact an administrator.',
      });
    }

    const token = generateToken(user, res);

    return res.status(200).json({
      message: 'Login successful',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Login failed',
      details: error.message,
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get profile',
      details: error.message,
    });
  }
};

export { register, login, logout, me };
