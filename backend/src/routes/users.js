const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../lib/token');

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = verifyToken(token);
    
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    req.adminId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的令牌' });
  }
}

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search, role } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { studentId: { contains: search } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取用户失败' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, studentId, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '姓名、邮箱和密码是必填的' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          studentId ? { studentId } : undefined
        ].filter(Boolean)
      }
    });

    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ error: '邮箱已被使用' });
      }
      if (studentId && existing.studentId === studentId) {
        return res.status(409).json({ error: '学号已被使用' });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        studentId: studentId || null,
        role: role || 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建用户失败' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, studentId, role } = req.body;
    const userId = parseInt(req.params.id);

    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (emailExists) {
        return res.status(409).json({ error: '邮箱已被使用' });
      }
    }

    if (studentId && studentId !== existing.studentId) {
      const studentIdExists = await prisma.user.findFirst({
        where: { studentId, NOT: { id: userId } }
      });
      if (studentIdExists) {
        return res.status(409).json({ error: '学号已被使用' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (studentId !== undefined) updateData.studentId = studentId || null;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '更新用户失败' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const existing = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (existing.role === 'ADMIN') {
      return res.status(400).json({ error: '不能删除管理员账号' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

module.exports = router;
