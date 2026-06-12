// routeهای مدیریت اهداف پس‌انداز

const express = require("express");
const db = require("../database/db");
const {
  sendSuccess,
  sendError,
  isPositiveNumber,
  isValidDate,
  VALID_GOAL_TYPES,
  formatGoal,
} = require("../utils/helpers");

const router = express.Router();

router.post("/", (req, res) => {
  const { title, goal_type, target_amount, target_date } = req.body;

  if (
    !title ||
    typeof title !== "string" ||
    title.trim() === "" ||
    !goal_type ||
    !VALID_GOAL_TYPES.includes(goal_type) ||
    !isPositiveNumber(Number(target_amount))
  ) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  if (target_date !== undefined && !isValidDate(target_date)) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const result = db
    .prepare(
      `INSERT INTO goals (user_id, title, goal_type, target_amount, target_date)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      title.trim(),
      goal_type,
      Number(target_amount),
      target_date || null
    );

  const goal = db
    .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
    .get(result.lastInsertRowid, req.user.id);

  return sendSuccess(res, "هدف با موفقیت ثبت شد", {
    goal: formatGoal(goal),
  }, 201);
});

router.get("/", (_req, res) => {
  const goals = db
    .prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC")
    .all(_req.user.id);

  return sendSuccess(res, "لیست اهداف", {
    goals: goals.map(formatGoal),
  });
});

router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "هدف یافت نشد", 404);
  }

  const { title, goal_type, target_amount, target_date } = req.body;

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }
  if (goal_type !== undefined && !VALID_GOAL_TYPES.includes(goal_type)) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }
  if (target_amount !== undefined && !isPositiveNumber(Number(target_amount))) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }
  if (target_date !== undefined && target_date !== null && !isValidDate(target_date)) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  db.prepare(
    `UPDATE goals SET title = ?, goal_type = ?, target_amount = ?, target_date = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    title ? title.trim() : existing.title,
    goal_type ?? existing.goal_type,
    target_amount !== undefined ? Number(target_amount) : existing.target_amount,
    target_date !== undefined ? target_date : existing.target_date,
    req.params.id,
    req.user.id
  );

  const updated = db
    .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  return sendSuccess(res, "هدف با موفقیت ویرایش شد", {
    goal: formatGoal(updated),
  });
});

router.patch("/:id/deposit", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "هدف یافت نشد", 404);
  }

  const { amount } = req.body;

  if (!isPositiveNumber(Number(amount))) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const newAmount = existing.current_amount + Number(amount);

  db.prepare(
    "UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?"
  ).run(newAmount, req.params.id, req.user.id);

  const updated = db
    .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  return sendSuccess(res, "مبلغ با موفقیت به هدف اضافه شد", {
    goal: formatGoal(updated),
  });
});

router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT id FROM goals WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "هدف یافت نشد", 404);
  }

  db.prepare("DELETE FROM goals WHERE id = ? AND user_id = ?").run(
    req.params.id,
    req.user.id
  );

  return sendSuccess(res, "هدف با موفقیت حذف شد");
});

module.exports = router;
