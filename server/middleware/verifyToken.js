const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ msg: "Access Denied. No token provided." });

  try {
    // Splits "Bearer <token>" to get just the token
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified.user; 
    next();
  } catch (err) {
    res.status(400).json({ msg: "Invalid Token" });
  }
};