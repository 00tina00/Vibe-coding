// توابع کمکی مشترک بین routeها

const VALID_CATEGORIES = ["other", "fun", "food", "transport"];
const VALID_TYPES = ["expense", "income"];
const VALID_GOAL_TYPES = ["house", "wedding", "retirement", "kids", "other"];

function sendSuccess(res, message, data = null, status = 200) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
}

function sendError(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

function isPositiveNumber(value) {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function getMotivationalMessage(progressPercent) {
  if (progressPercent >= 100) return "به هدفت رسیدی، تبریک! 🎉";
  if (progressPercent >= 76) return "کمی مونده، تسلیم نشو! 🚀";
  if (progressPercent >= 51) return "داری به هدفت نزدیک میشی! 🔥";
  if (progressPercent >= 26) return "نصف راه رو اومدی، آفرین! 🌟";
  return "شروع خوبیه! ادامه بده 💪";
}

function formatGoal(goal) {
  const progressPercent = Math.min(
    100,
    Math.round((goal.current_amount / goal.target_amount) * 100)
  );
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  return {
    ...goal,
    progress_percent: progressPercent,
    remaining,
    motivational_message: getMotivationalMessage(progressPercent),
  };
}

function formatTransaction(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    amount: row.amount,
    category: row.category,
    description: row.description,
    receipt_url: row.receipt_image
      ? `/uploads/receipts/${row.receipt_image}`
      : null,
    date: row.date,
  };
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthDateRange(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { fromDate, toDate };
}

module.exports = {
  VALID_CATEGORIES,
  VALID_TYPES,
  VALID_GOAL_TYPES,
  sendSuccess,
  sendError,
  isPositiveNumber,
  isValidDate,
  getMotivationalMessage,
  formatGoal,
  formatTransaction,
  getCurrentMonth,
  getMonthDateRange,
};
