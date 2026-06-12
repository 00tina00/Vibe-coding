// routeهای مدیریت تقویم و رویدادها

const express = require("express");
const axios = require("axios");
const ical = require("node-ical");
const db = require("../database/db");
const {
  sendSuccess,
  sendError,
  isPositiveNumber,
  isValidDate,
} = require("../utils/helpers");

const router = express.Router();

router.post("/events", (req, res) => {
  const { title, estimated_amount, event_date } = req.body;

  if (
    !title ||
    typeof title !== "string" ||
    title.trim() === "" ||
    !isValidDate(event_date)
  ) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  if (
    estimated_amount !== undefined &&
    estimated_amount !== null &&
    !isPositiveNumber(Number(estimated_amount))
  ) {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  const result = db
    .prepare(
      `INSERT INTO calendar_events (user_id, title, estimated_amount, event_date, source)
       VALUES (?, ?, ?, ?, 'manual')`
    )
    .run(
      req.user.id,
      title.trim(),
      estimated_amount !== undefined ? Number(estimated_amount) : null,
      event_date
    );

  const event = db
    .prepare("SELECT * FROM calendar_events WHERE id = ? AND user_id = ?")
    .get(result.lastInsertRowid, req.user.id);

  return sendSuccess(res, "رویداد با موفقیت ثبت شد", { event }, 201);
});

router.get("/events", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const events = db
    .prepare(
      `SELECT * FROM calendar_events
       WHERE user_id = ? AND date(event_date) >= date(?)
       ORDER BY event_date ASC`
    )
    .all(req.user.id, today);

  return sendSuccess(res, "لیست رویدادهای آینده", { events });
});

router.get("/sync", async (req, res) => {
  const { ical_url } = req.query;

  if (!ical_url || typeof ical_url !== "string") {
    return sendError(res, "اطلاعات وارد شده معتبر نیست");
  }

  try {
    let parsed;

    try {
      parsed = await ical.async.fromURL(ical_url);
    } catch {
      const response = await axios.get(ical_url, { timeout: 15000 });
      parsed = ical.sync.parseICS(response.data);
    }

    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const events = [];

    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (item.type !== "VEVENT") continue;

      const start = item.start ? new Date(item.start) : null;
      if (!start || isNaN(start.getTime())) continue;
      if (start < now || start > thirtyDaysLater) continue;

      events.push({
        title: item.summary || "بدون عنوان",
        event_date: start.toISOString(),
        description: item.description || null,
        location: item.location || null,
        source: "ical",
        estimated_amount: null,
      });
    }

    events.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

    return sendSuccess(res, "تقویم با موفقیت همگام‌سازی شد", { events });
  } catch {
    return sendError(res, "خطا در همگام‌سازی تقویم", 500);
  }
});

router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT id FROM calendar_events WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

  if (!existing) {
    return sendError(res, "رویداد یافت نشد", 404);
  }

  db.prepare("DELETE FROM calendar_events WHERE id = ? AND user_id = ?").run(
    req.params.id,
    req.user.id
  );

  return sendSuccess(res, "رویداد با موفقیت حذف شد");
});

module.exports = router;
