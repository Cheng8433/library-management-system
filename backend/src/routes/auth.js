// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
// --- 关键：引入项目自带的 token 工具 ---
const { signToken } = require('../lib/token'); 

const router = express.Router();
const prisma = new PrismaClient();

// ... 馆员注册/登录代码 (如果也要改，就把 jwt.sign 换成 signToken) ...

// --- 学生登录接口 (使用数据库真实数据) ---
router.post('/login-student', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. 在数据库 User 表中根据 email 查找真实学生
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 2. 验证密码：将用户输入的 password 与数据库中的 passwordHash 进行对比
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 3. 生成 Token (使用项目自带的 signToken 函数)
    // 注意：middleware/auth.js 要求 Number(payload.sub)，所以这里必须传 sub
    const token = signToken({
      sub: String(user.id), // 中间件期待的标识符
      id: user.id,
      role: user.role
    });

    res.json({
      message: '学生登录成功',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '登录过程中发生错误' });
  }
});

module.exports = router;