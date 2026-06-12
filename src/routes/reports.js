// routeهای گزارش‌گیری و داشبورد

const express = require("express");
const db = require("../database/db");
const {
  sendSuccess,
  VALID_CATEGORIES,
  getCurrentMonth,
  getMonthDateRange,
  formatGoal,
} = require("../utils/helpers");

const router = express.Router();

function getMonthTotals(userId, month) {
  const { fromDate, toDate } = getMonthDateRange(month);

  const income = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'income'
         AND date(date) >= date(?) AND date(date) <= date(?)`
    )
    .get(userId, fromDate, toDate).total;

  const expenses = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'expense'
         AND date(date) >= date(?) AND date(date) <= date(?)`
    )
    .get(userId, fromDate, toDate).total;

  return { income, expenses };
}

function getTotalBalance(userId) {
  const income = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'"
    )
    .get(userId).total;

  const expenses = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense'"
    )
    .get(userId).total;

  return income - expenses;
}

function getCategoryBreakdown(userId, fromDate, toDate) {
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
    .all(userId, fromDate, toDate);

  let total = 0;
  for (const row of rows) {
    byCategory[row.category] = row.total;
    total += row.total;
  }

  return { total, byCategory };
}

function getExceededBudgets(userId, month) {
  const budgets = db
    .prepare("SELECT * FROM budgets WHERE user_id = ? AND month = ?")
    .all(userId, month);

  const exceeded = [];
  for (const budget of budgets) {
    const { fromDate, toDate } = getMonthDateRange(month);
    const spent = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND type = 'expense' AND category = ?
           AND date(date) >= date(?) AND date(date) <= date(?)`
      )
      .get(userId, budget.category, fromDate, toDate).total;

    const remaining = budget.limit_amount - spent;
    if (remaining < 0) {
      exceeded.push({
        id: budget.id,
        category: budget.category,
        limit_amount: budget.limit_amount,
        spent,
        exceeded_by: Math.abs(remaining),
        warning: "بودجه این دسته رد شده است",
      });
    }
  }
  return exceeded;
}

router.get("/dashboard", (req, res) => {
  const userId = req.user.id;
  const month = getCurrentMonth();
  const { fromDate, toDate } = getMonthDateRange(month);
  const { income, expenses } = getMonthTotals(userId, month);
  const totalBalance = getTotalBalance(userId);

  const categoryRows = db
    .prepare(
      `SELECT category, SUM(amount) as total FROM transactions
       WHERE user_id = ? AND type = 'expense'
         AND date(date) >= date(?) AND date(date) <= date(?)
       GROUP BY category ORDER BY total DESC LIMIT 1`
    )
    .get(userId, fromDate, toDate);

  const exceededBudgets = getExceededBudgets(userId, month);

  const activeGoals = db
    .prepare(
      "SELECT * FROM goals WHERE user_id = ? AND current_amount < target_amount ORDER BY id DESC LIMIT 5"
    )
    .all(userId)
    .map(formatGoal);

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = db
    .prepare(
      `SELECT * FROM calendar_events
       WHERE user_id = ? AND date(event_date) >= date(?)
       ORDER BY event_date ASC LIMIT 5`
    )
    .all(userId, today);

  const warnings = exceededBudgets.map((b) => b.warning);

  return sendSuccess(res, "داشبورد", {
    total_balance: totalBalance,
    income_this_month: income,
    expenses_this_month: expenses,
    top_spending_category: categoryRows ? categoryRows.category : "",
    exceeded_budgets: exceededBudgets,
    active_goals: activeGoals,
    upcoming_events: upcomingEvents,
    warnings,
  });
});

router.get("/monthly", (req, res) => {
  const month = req.query.month || getCurrentMonth();
  const { fromDate, toDate } = getMonthDateRange(month);
  const { income, expenses } = getMonthTotals(req.user.id, month);
  const { byCategory } = getCategoryBreakdown(req.user.id, fromDate, toDate);

  return sendSuccess(res, "گزارش ماهانه", {
    month,
    income,
    expenses,
    net: income - expenses,
    by_category: byCategory,
  });
});

router.get("/balance", (req, res) => {
  const balance = getTotalBalance(req.user.id);

  const income = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'"
    )
    .get(req.user.id).total;

  const expenses = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense'"
    )
    .get(req.user.id).total;

  return sendSuccess(res, "موجودی کل", {
    total_balance: balance,
    total_income: income,
    total_expenses: expenses,
  });
});

router.get("/by-category", (req, res) => {
  const month = req.query.month || getCurrentMonth();
  const { fromDate, toDate } = getMonthDateRange(month);
  const breakdown = getCategoryBreakdown(req.user.id, fromDate, toDate);

  return sendSuccess(res, "تفکیک هزینه بر اساس دسته‌بندی", breakdown);
});

module.exports = router;
