const prisma = require('../lib/prisma');
const { verifyToken } = require('../lib/token');

function extractBearerToken(authorizationHeader) {
    if (!authorizationHeader) return null;
    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token.trim();
}

async function requireAuth(req, res, next) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header.' });
    }

    try {
        const payload = verifyToken(token);
        const userId = Number(payload.sub);
        if (!userId) {
            return res.status(401).json({ message: 'Token payload is invalid.' });
        }

        // 统一从 User 表查询用户
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists.' });
        }

        req.auth = payload;
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,          // 从数据库获取角色
            ...payload,               // 保留 token 中的其他字段
        };
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

module.exports = { requireAuth };