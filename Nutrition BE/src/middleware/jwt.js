const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy token sau "Bearer"

  if (!token) return res.status(401).json({ message: 'Access token required' });

  // Giải mã token
  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    if (req.method === 'GET') {
      req.query.userId = user.userId;
    } else {
      req.body.userId = user.userId;
    }
    req.token = token;
    next(); // Cho phép tiếp tục xử lý controller tiếp theo
  });
};

module.exports = authenticateToken;
