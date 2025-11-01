// middleware/role_middleware.js
function verifyAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admins only.' });
}

function verifyUser(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { verifyAdmin, verifyUser };
