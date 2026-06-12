// routeهای مدیریت تراکنش‌ها (هزینه و درآمد)

const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../database/db");
const upload = require("../middleware/upload");
const {
  sendSuccess,
  sendError,
  isPositiveNumber,
  isValidDate,
  VALID_CATEGORIES,
  VALID_TYPES,
  formatTransaction,
} = require("../utils/helpers");

const router = express.Router();

function validateTransactionBody(body, isUpdate = false) {
  const { type, title, amount, category, description, date } = body;

  if (!isUpdate) {
    if (!type || !VALID_TYPES.includes(type)) return false;
    if (!title || typeof title !== "string" || title.trim() === "") return false;
    if (!isPositiveNumber(Number(amount))) return false;
    if (!category || !VALID_CATEGORIES.includes(category)) return false;
  } else {
    if (type !== undefined && !VALID_TYPES.includes(type)) return false;
    if (title !== undefined && (typeof title !== "string" || title.trim() === ""))
      return false;
    if (amount !== undefined && !isPositiveNumber(Number(amount))) return false;
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) return false;
  }

  if (date !== undefined && !isValidDate(date)) return false;

  return true;
}

router.post("/", upload.single("receipt"), (req, res) => {
  const { type, title, amount, category, description, date } = req.body;

  if (!validateTransactionBody(req.body)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const receiptImage = req.file ? path.basename(req.file.path) : null;

  const result = db
    .prepare(
      `INSERT INTO transactions (user_id, type, title, amount, category, description, receipt_image, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      type,
      title.trim(),
      Number(amount),
      category,
      description || null,
      receiptImage,
      date || new Date().toISOString()
    );

  const transaction = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(result.lastInsertRowid, req.user.id);

  return sendSuccess(res, "تراکنش با موفقیت ثبت شد", {
    transaction: formatTransaction(transaction),
  }, 201);
});

router.get("/", (req, res) => {
  const {
    type,
    category,
    from_date,
    to_date,
    search,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let where = "WHERE user_id = ?";
  const params = [req.user.id];

  if (type) {
    if (!VALID_TYPES.includes(type)) {
      return sendError(res, "اطلاعات وارد شده معتبر نیست");
    }
    where += " AND type = ?";
    params.push(type);
  }

  if (category) {
    where += " AND category = ?";
    params.push(category);
  }

  if (from_date) {
    where += " AND date(date) >= date(?)";
    params.push(from_date);
  }

  if (to_date) {
    where += " AND date(date) <= date(?)";
    params.push(to_date);
  }

  if (search) {
    where += " AND (title LIKE ? OR description LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term);
  }

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM transactions ${where}`)
    .get(...params);

  const rows = db
    .prepare(
      `SELECT * FROM transactions ${where} ORDER BY date DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limitNum, offset);

  return sendSuccess(res, "لیست تراکنش‌ها", {
    transactions: rows.map(formatTransaction),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRow.total,
      total_pages: Math.ceil(countRow.total / limitNum),
    },
  });
});

router.get("/:id", (req, res) => {
  const transaction = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!transaction) {
    return sendError(res, "تراکنش یافت نشد", 404);
  }

  return sendSuccess(res, "جزئیات تراکنش", {
    transaction: formatTransaction(transaction),
  });
});

router.put("/:id", upload.single("receipt"), (req, res) => {
  const existing = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendError(res, "تراکنش یافت نشد", 404);
  }

  if (!validateTransactionBody(req.body, true)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const { type, title, amount, category, description, date } = req.body;

  let receiptImage = existing.receipt_image;
  if (req.file) {
    if (existing.receipt_image) {
      const oldPath = path.join(
        process.env.UPLOAD_PATH || path.join(process.cwd(), "uploads", "receipts"),
        existing.receipt_image
      );
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    receiptImage = path.basename(req.file.path);
  }

  db.prepare(
    `UPDATE transactions SET
      type = ?, title = ?, amount = ?, category = ?,
      description = ?, receipt_image = ?, date = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    type ?? existing.type,
    title ? title.trim() : existing.title,
    amount !== undefined ? Number(amount) : existing.amount,
    category ?? existing.category,
    description !== undefined ? description : existing.description,
    receiptImage,
    date ?? existing.date,
    req.params.id,
    req.user.id
  );

  const updated = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  return sendSuccess(res, "تراکنش با موفقیت ویرایش شد", {
    transaction: formatTransaction(updated),
  });
});

router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "تراکنش یافت نشد", 404);
  }

  if (existing.receipt_image) {
    const filePath = path.join(
      process.env.UPLOAD_PATH || path.join(process.cwd(), "uploads", "receipts"),
      existing.receipt_image
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(
    req.params.id,
    req.user.id
  );

  return sendSuccess(res, "تراکنش با موفقیت حذف شد");
});

module.exports = router;
