/**
 * Requires `authMiddleware` to run first (`req.user` set, no password field).
 * @param {string[]} allowedRoles - Prisma UserRole values
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
}
