// اتصال به SQLite و اجرای migrationها در زمان راه‌اندازی

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { runMigrations } = require("./migrations");

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "pfm.db");

// اطمینان از وجود پوشه فایل دیتابیس
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// فعال‌سازی foreign key
db.pragma("foreign_keys = ON");

runMigrations(db);

module.exports = db;
