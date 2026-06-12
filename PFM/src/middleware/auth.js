// میدلور احراز هویت با JWT

const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/helpers");

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_me";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "توکن معتبر نیست", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return sendError(res, "توکن معتبر نیست", 401);
  }
}

module.exports = { verifyToken, JWT_SECRET };
