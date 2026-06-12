// routeهای مدیریت بودجه ماهانه

const express = require("express");
const db = require("../database/db");
const {
  sendSuccess,
  sendError,
  isPositiveNumber,
  VALID_CATEGORIES,
  getMonthDateRange,
} = require("../utils/helpers");

const router = express.Router();

function getCategoryExpenses(userId, category, month) {
  const { fromDate, toDate } = getMonthDateRange(month);
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND category = ?
         AND date(date) >= date(?) AND date(date) <= date(?)`
    )
    .get(userId, category, fromDate, toDate);
  return row.total;
}

function formatBudget(budget) {
  const spent = getCategoryExpenses(
    budget.user_id,
    budget.category,
    budget.month
  );
  const remaining = budget.limit_amount - spent;
  const result = {
    id: budget.id,
    user_id: budget.user_id,
    category: budget.category,
    limit_amount: budget.limit_amount,
    month: budget.month,
    spent,
    remaining,
    status: remaining >= 0 ? "ok" : "exceeded",
  };

  if (remaining < 0) {
    result.warning = "بودجه این دسته رد شده است";
    result.exceeded_by = Math.abs(remaining);
  }

  return result;
}

router.post("/", (req, res) => {
  const { category, limit_amount, month } = req.body;

  if (
    !category ||
    !VALID_CATEGORIES.includes(category) ||
    !isPositiveNumber(Number(limit_amount)) ||
    !month ||
    !/^\d{4}-\d{2}$/.test(month)
  ) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const result = db
    .prepare(
      "INSERT INTO budgets (user_id, category, limit_amount, month) VALUES (?, ?, ?, ?)"
    )
    .run(req.user.id, category, Number(limit_amount), month);

  const budget = db
    .prepare("SELECT * FROM budgets WHERE id = ? AND user_id = ?")
    .get(result.lastInsertRowid, req.user.id);

  return sendSuccess(res, "بودجه با موفقیت ثبت شد", {
    budget: formatBudget(budget),
  }, 201);
});

router.get("/", (req, res) => {
  const { month } = req.query;
  let budgets;

  if (month) {
    budgets = db
      .prepare("SELECT * FROM budgets WHERE user_id = ? AND month = ?")
      .all(req.user.id, month);
  } else {
    budgets = db
      .prepare("SELECT * FROM budgets WHERE user_id = ? ORDER BY month DESC")
      .all(req.user.id);
  }

  return sendSuccess(res, "لیست بودجه‌ها", {
    budgets: budgets.map(formatBudget),
  });
});

router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM budgets WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "بودجه یافت نشد", 404);
  }

  const { category, limit_amount, month } = req.body;

  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }
  if (limit_amount !== undefined && !isPositiveNumber(Number(limit_amount))) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }
  if (month !== undefined && !/^\d{4}-\d{2}$/.test(month)) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  db.prepare(
    "UPDATE budgets SET category = ?, limit_amount = ?, month = ? WHERE id = ? AND user_id = ?"
  ).run(
    category ?? existing.category,
    limit_amount !== undefined ? Number(limit_amount) : existing.limit_amount,
    month ?? existing.month,
    req.params.id,
    req.user.id
  );

  const updated = db
    .prepare("SELECT * FROM budgets WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  return sendSuccess(res, "بودجه با موفقیت ویرایش شد", {
    budget: formatBudget(updated),
  });
});

router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT id FROM budgets WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "بودجه یافت نشد", 404);
  }

  db.prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?").run(
    req.params.id,
    req.user.id
  );

  return sendSuccess(res, "بودجه با موفقیت حذف شد");
});

module.exports = router;
