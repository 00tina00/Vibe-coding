// routeهای احراز هویت: ثبت‌نام، ورود و پروفایل

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { verifyToken, JWT_SECRET } = require("../middleware/auth");
const { sendSuccess, sendError } = require("../utils/helpers");

const router = express.Router();
const SALT_ROUNDS = 12;

router.post("/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email.trim().toLowerCase());

  if (existing) {
    return sendError(res, "این ایمیل قبلاً ثبت شده است", 409);
  }

  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  const result = db
    .prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)")
    .run(email.trim().toLowerCase(), hashedPassword, name || null);

  const user = db
    .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return sendSuccess(
    res,
    "ثبت‌نام با موفقیت انجام شد",
    { token, user: { id: user.id, email: user.email, name: user.name } },
    201
  );
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return sendError(res, "ایمیل یا رمز عبور اشتباه است", 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return sendSuccess(res, "ورود با موفقیت انجام شد", {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.get("/profile", verifyToken, (req, res) => {
  const user = db
    .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return sendError(res, "کاربر یافت نشد", 404);
  }

  return sendSuccess(res, "پروفایل با موفقیت دریافت شد", { user });
});

module.exports = router;
