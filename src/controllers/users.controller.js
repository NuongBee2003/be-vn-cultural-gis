const bcrypt = require('bcryptjs');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');

const USER_SAFE_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  avatar: true,
  createdAt: true,
};

function parseId(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function isValidRole(role) {
  return role === undefined || role === 'admin' || role === 'user';
}

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { id: 'asc' },
    });

    return res.json(users);
  } catch (err) {
    return next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'Invalid user id' } });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, email, password, role, avatar } = req.body || {};

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: { message: 'username is required' } });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: { message: 'email is required' } });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: { message: 'password must be at least 6 characters' } });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ error: { message: 'role must be admin or user' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: role || undefined,
        avatar: avatar || undefined,
      },
      select: USER_SAFE_SELECT,
    });

    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: { message: 'Email already exists' } });
      }
    }
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'Invalid user id' } });
    }

    const { username, email, password, role, avatar } = req.body || {};

    if (username !== undefined && typeof username !== 'string') {
      return res.status(400).json({ error: { message: 'username must be a string' } });
    }

    if (email !== undefined && typeof email !== 'string') {
      return res.status(400).json({ error: { message: 'email must be a string' } });
    }

    if (avatar !== undefined && avatar !== null && typeof avatar !== 'string') {
      return res.status(400).json({ error: { message: 'avatar must be a string or null' } });
    }

    if (role !== undefined && !isValidRole(role)) {
      return res.status(400).json({ error: { message: 'role must be admin or user' } });
    }

    let passwordHash;
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: { message: 'password must be at least 6 characters' } });
      }
      passwordHash = await bcrypt.hash(password, 10);
    }

    const data = {
      ...(username !== undefined ? { username } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(avatar !== undefined ? { avatar: avatar || null } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(passwordHash !== undefined ? { passwordHash } : {}),
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: { message: 'No fields to update' } });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: USER_SAFE_SELECT,
    });

    return res.json(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: { message: 'Email already exists' } });
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: { message: 'User not found' } });
      }
    }
    return next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: 'Invalid user id' } });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    return next(err);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
