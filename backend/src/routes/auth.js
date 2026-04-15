const express = require('express');
const bcrypt = require('bcrypt');

const prisma = require('../lib/prisma');
const {
    DEFAULT_EXPIRES_IN_SECONDS,
    signToken,
} = require('../lib/token');
const { toPublicUser } = require('../lib/user');

const router = express.Router();

/**
 * 统一登录接口 - 支持读者、图书管理员、系统管理员
 * 请求体: { email, password }
 * 所有用户使用邮箱 + 密码登录
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: '请提供邮箱和密码' });
    }

    // 查询用户（包括所有角色）
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成 JWT
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
});

/**
 * 读者注册接口（仅开放给读者）
 * 请求体: { name, email, studentId, password }
 */
router.post('/register/reader', async (req, res) => {
    const { name, email, studentId, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: '请填写完整信息' });
    }
    if (!email.includes('@')) {
        return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    try {
        // 检查邮箱或学号是否已被占用
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    studentId ? { studentId } : {}
                ].filter(Boolean)
            }
        });

        if (existing) {
            if (existing.email === email.toLowerCase()) {
                return res.status(400).json({ error: '该邮箱已被注册' });
            }
            if (studentId && existing.studentId === studentId) {
                return res.status(400).json({ error: '该学号已被注册' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                studentId: studentId || null,
                passwordHash: hashedPassword,
                role: 'STUDENT'   // 注册用户默认为读者
            }
        });

        // 注册成功后直接登录，返回 token
        const token = signToken({
            sub: user.id,
            role: user.role,
            email: user.email,
            studentId: user.studentId,
        });

        res.status(201).json({
            message: '注册成功',
            token,
            tokenType: 'Bearer',
            expiresIn: DEFAULT_EXPIRES_IN_SECONDS,
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '注册失败' });
    }
});

/**
 * 重置密码（读者）
 * 通过邮箱或学号验证身份，设置新密码
 * 请求体: { email, studentId, newPassword }  （至少提供 email 或 studentId 之一）
 */
router.post('/reset-password', async (req, res) => {
    const { email, studentId, newPassword } = req.body;

    if (!email && !studentId) {
        return res.status(400).json({ error: '请提供邮箱或学号' });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '新密码长度不能少于6位' });
    }

    try {
        const user = await prisma.user.findFirst({
            where: email ? { email: email.toLowerCase() } : { studentId }
        });

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        res.json({ message: '密码重置成功，请使用新密码登录' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '密码重置失败' });
    }
});

/**
 * 管理员重置密码（仅限管理员账号，实际使用时应在路由层增加鉴权）
 * 通过 email 重置密码
 * 请求体: { email, newPassword }
 */
router.post('/reset-password/admin', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: '请提供邮箱和新密码' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: '新密码长度不能少于6位' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || (user.role !== 'LIBRARIAN' && user.role !== 'ADMIN')) {
            return res.status(404).json({ error: '管理员账号不存在' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        res.json({ message: '密码重置成功，请使用新密码登录' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '密码重置失败' });
    }
});

module.exports = router;