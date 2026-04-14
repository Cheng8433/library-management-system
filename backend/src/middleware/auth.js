const prisma = require('../lib/prisma');
const { verifyToken } = require('../lib/token');
const { toPublicUser } = require('../lib/user');

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

async function requireAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: 'Missing or invalid Authorization header.',
    });
  }

  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);

    if (!userId) {
      return res.status(401).json({ message: 'Token payload is invalid.' });
    }

    let user = null;
    let userType = null;

    if (payload.role === 'LIBRARIAN') {
      user = await prisma.librarian.findUnique({
        where: { id: userId },
      });
      if (user) {
        userType = 'librarian';
      }
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) {
        userType = 'user';
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.auth = payload;
    req.user = {
      ...payload,
      id: user.id,
      name: user.name,
      role: payload.role || (userType === 'librarian' ? 'LIBRARIAN' : user.role),
    };
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
}

module.exports = {
  requireAuth,
};
