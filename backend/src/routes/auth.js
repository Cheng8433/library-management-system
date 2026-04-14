const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = require('../lib/prisma');
const {
  DEFAULT_EXPIRES_IN_SECONDS,
  signToken,
} = require('../lib/token');
const { toPublicUser } = require('../lib/user');

const router = express.Router();
const JWT_SECRET = 'library-management-secret-key-2024';

// 读者/管理员登录接口
router.post('/login', async (req, res) => {
  const { account, password, employeeId, email, studentId } = req.body;

  const loginPassword = password;
  let user = null;
  let userType = null;

  // 尝试用 employeeId 登录（管理员）
  if (employeeId) {
    try {
      const librarian = await prisma.librarian.findUnique({
        where: { employeeId: employeeId }
      });

      if (librarian) {
        const isValid = await bcrypt.compare(loginPassword, librarian.password);
        if (isValid) {
          const token = signToken({
            sub: librarian.id,
            role: 'LIBRARIAN',
            employeeId: librarian.employeeId,
            name: librarian.name,
          });

          return res.json({
            message: '登录成功',
            token,
            tokenType: 'Bearer',
            expiresIn: DEFAULT_EXPIRES_IN_SECONDS,
            user: {
              id: librarian.id,
              name: librarian.name,
              role: 'LIBRARIAN',
              employeeId: librarian.employeeId,
            },
          });
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: '登录失败' });
    }
  }

  // 尝试用 account/email/studentId 登录（读者）
  const loginAccount = account || email || studentId;
  if (loginAccount) {
    const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';
    const normalizeEmail = (value) => normalizeText(value).toLowerCase();
    
    const loginEmail = loginAccount.includes('@') ? normalizeEmail(loginAccount) : '';
    const loginStudentId = loginEmail ? '' : normalizeText(loginAccount);

    try {
      user = await prisma.user.findFirst({
        where: loginEmail ? { email: loginEmail } : { studentId: loginStudentId },
      });

      if (user) {
        const isPasswordValid = await bcrypt.compare(loginPassword, user.passwordHash);
        if (isPasswordValid) {
          const token = signToken({
            sub: user.id,
            role: user.role,
            email: user.email,
            studentId: user.studentId,
          });

          return res.json({
            message: '登录成功',
            token,
            tokenType: 'Bearer',
            expiresIn: DEFAULT_EXPIRES_IN_SECONDS,
            user: toPublicUser(user),
          });
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: '登录失败' });
    }
  }

  return res.status(401).json({ error: '账号或密码错误' });
});

// 管理员注册接口
router.post('/register', async (req, res) => {
  const { employeeId, name, password } = req.body;

  if (!employeeId || !name || !password) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  try {
    const existing = await prisma.librarian.findUnique({
      where: { employeeId: employeeId }
    });
    if (existing) {
      return res.status(400).json({ error: '工号已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const librarian = await prisma.librarian.create({
      data: {
        employeeId: employeeId,
        name: name,
        password: hashedPassword
      }
    });

    res.status(201).json({
      message: '注册成功',
      librarian: {
        id: librarian.id,
        employeeId: librarian.employeeId,
        name: librarian.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '注册失败' });
  }
});

module.exports = router;