// routeهای سازگار با فاز ۱ (پشتیبانی از /api/expenses و /api/summary)

const express = require("express");
const db = require("../database/db");
const {
  sendSuccess,
  sendError,
  isPositiveNumber,
  VALID_CATEGORIES,
  formatTransaction,
  getCurrentMonth,
  getMonthDateRange,
} = require("../utils/helpers");

const router = express.Router();

router.post("/expenses", (req, res) => {
  const { title, amount, category } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  if (!isPositiveNumber(Number(amount))) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const result = db
    .prepare(
      `INSERT INTO transactions (user_id, type, title, amount, category, date)
       VALUES (?, 'expense', ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      title.trim(),
      Number(amount),
      category,
      new Date().toISOString()
    );

  const transaction = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(result.lastInsertRowid, req.user.id);

  return sendSuccess(res, "تراکنش با موفقیت ثبت شد", {
    expense: formatTransaction(transaction),
  }, 201);
});

router.get("/expenses", (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM transactions WHERE user_id = ? AND type = 'expense' ORDER BY date DESC`
    )
    .all(req.user.id);

  return sendSuccess(res, "لیست هزینه‌ها", {
    expenses: rows.map(formatTransaction),
  });
});

router.get("/summary", (req, res) => {
  const month = req.query.month || getCurrentMonth();
  const { fromDate, toDate } = getMonthDateRange(month);

  const byCategory = Object.fromEntries(
    VALID_CATEGORIES.map((c) => [c, 0])
  );

  const rows = db
    .prepare(
      `SELECT category, SUM(amount) as total FROM transactions
       WHERE user_id = ? AND type = 'expense'
         AND date(date) >= date(?) AND date(date) <= date(?)
       GROUP BY category`
    )
    .all(req.user.id, fromDate, toDate);

  let total = 0;
  for (const row of rows) {
    byCategory[row.category] = row.total;
    total += row.total;
  }

  return sendSuccess(res, "خلاصه هزینه‌ها", { total, byCategory });
});

module.exports = router;
