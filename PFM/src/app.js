// تنظیمات اصلی Express و ثبت routeها

const express = require("express");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("./middleware/auth");
const { sendError } = require("./utils/helpers");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const goalRoutes = require("./routes/goals");
const calendarRoutes = require("./routes/calendar");
const reportRoutes = require("./routes/reports");
const legacyRoutes = require("./routes/legacy");

const app = express();

// بارگذاری دیتابیس (اجرای migrationها)
require("./database/db");

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// سرو فایل‌های استاتیک آپلود
const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// routeهای عمومی (بدون احراز هویت)
app.use("/api/auth", authRoutes);

// میدلور احراز هویت برای سایر routeها
app.use("/api", (req, res, next) => {
  if (
    req.path === "/auth/register" ||
    req.path === "/auth/login"
  ) {
    return next();
  }
  return verifyToken(req, res, next);
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", legacyRoutes);

// هندلر خطای آپلود فایل
app.use((err, req, res, next) => {
  if (err instanceof require("multer").MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "حجم فایل نباید بیشتر از ۵ مگابایت باشد", 400);
    }
    return sendError(res, "خطا در آپلود فایل", 400);
  }
  if (err && err.message === "فرمت فایل مجاز نیست") {
    return sendError(res, "فرمت فایل مجاز نیست. فقط jpg, jpeg, png, webp", 400);
  }
  next(err);
});

// هندلر خطای سراسری
app.use((err, _req, res, _next) => {
  console.error(err);
  return sendError(res, "خطای داخلی سرور", 500);
});

// route یافت نشد
app.use((_req, res) => {
  return sendError(res, "مسیر درخواستی یافت نشد", 404);
});

module.exports = app;
