# مدیریت مالی شخصی (PFM)

یک API backend برای ثبت هزینه‌ها، درآمدها، بودجه، اهداف پس‌انداز و رویدادهای تقویمی — با ذخیره‌سازی پایدار در SQLite.

---

## معرفی پروژه

این پروژه یک **مدیریت مالی شخصی** است که در دو فاز توسعه یافته:

| فاز | توضیح |
|-----|-------|
| فاز ۱ | ثبت هزینه در RAM (جایگزین شده) |
| فاز ۲ | SQLite، احراز هویت JWT، بودجه، اهداف، تقویم، گزارش‌ها |

هر کاربر فقط به داده‌های خودش دسترسی دارد.

---

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js نسخه ۱۸ یا بالاتر
- npm

### قدم ۱ — کلون و نصب

```bash
cd PFM
npm install
```

### قدم ۲ — تنظیم متغیرهای محیطی

```bash
cp .env.example .env
```

فایل `.env` را ویرایش کنید:

```env
PORT=3000
JWT_SECRET=یک_رشته_تصادفی_و_امن
DB_PATH=./pfm.db
UPLOAD_PATH=./uploads/receipts
```

### قدم ۳ — اجرای سرور

```bash
npm start
```

سرور روی `http://localhost:3000` بالا می‌آید. فایل `pfm.db` به‌صورت خودکار ساخته می‌شود.

---

## ساختار پوشه‌های پروژه

```
PFM/
├── src/
│   ├── database/
│   │   ├── db.js              # اتصال SQLite
│   │   └── migrations.js      # جداول دیتابیس
│   ├── middleware/
│   │   ├── auth.js            # احراز هویت JWT
│   │   └── upload.js          # آپلود رسید
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── goals.js
│   │   ├── calendar.js
│   │   ├── reports.js
│   │   └── legacy.js          # سازگاری با فاز ۱
│   ├── utils/
│   │   └── helpers.js
│   └── app.js
├── uploads/
│   └── receipts/
├── index.js
├── pfm.db                     # (بعد از اولین اجرا)
├── .env
├── .env.example
└── README.md
```

---

## احراز هویت

بیشتر endpointها نیاز به توکن JWT دارند:

```
Authorization: Bearer <token>
```

توکن از `/api/auth/register` یا `/api/auth/login` دریافت می‌شود و **۷ روز** اعتبار دارد.

---

## فرمت پاسخ API

**موفق:**
```json
{ "success": true, "message": "پیام فارسی", "data": {} }
```

**خطا:**
```json
{ "success": false, "message": "پیام خطای فارسی" }
```

---

## جدول کامل APIها

### احراز هویت

| متد | مسیر | توضیح | احراز هویت |
|-----|------|-------|------------|
| POST | `/api/auth/register` | ثبت‌نام | خیر |
| POST | `/api/auth/login` | ورود | خیر |
| GET | `/api/auth/profile` | پروفایل | بله |

#### POST `/api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "علی"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "ثبت‌نام با موفقیت انجام شد",
  "data": {
    "token": "eyJhbG...",
    "user": { "id": 1, "email": "user@example.com", "name": "علی" }
  }
}
```

#### POST `/api/auth/login`

**Request:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response:**
```json
{
  "success": true,
  "message": "ورود با موفقیت انجام شد",
  "data": {
    "token": "eyJhbG...",
    "user": { "id": 1, "email": "user@example.com", "name": "علی" }
  }
}
```

---

### تراکنش‌ها

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/api/transactions` | ثبت تراکنش (با آپلود اختیاری رسید) |
| GET | `/api/transactions` | لیست با فیلتر و صفحه‌بندی |
| GET | `/api/transactions/:id` | جزئیات |
| PUT | `/api/transactions/:id` | ویرایش |
| DELETE | `/api/transactions/:id` | حذف |

**Query params برای GET:**
- `type` — `expense` یا `income`
- `category` — `food`, `transport`, `fun`, `other`
- `from_date`, `to_date` — `YYYY-MM-DD`
- `search` — جستجو در عنوان و توضیح
- `page` (پیش‌فرض: ۱), `limit` (پیش‌فرض: ۲۰)

#### POST `/api/transactions`

**Request (JSON):**
```json
{
  "type": "expense",
  "title": "ناهار",
  "amount": 18500,
  "category": "food",
  "description": "رستوران",
  "date": "2026-06-12T10:00:00.000Z"
}
```

**Request (با رسید — multipart/form-data):**
- فیلدها: `type`, `title`, `amount`, `category`, `description`, `date`
- فایل: `receipt` (jpg, jpeg, png, webp — حداکثر ۵MB)

**Response (201):**
```json
{
  "success": true,
  "message": "تراکنش با موفقیت ثبت شد",
  "data": {
    "transaction": {
      "id": 1,
      "type": "expense",
      "title": "ناهار",
      "amount": 18500,
      "category": "food",
      "receipt_url": "/uploads/receipts/receipt_1234567890_photo.jpg",
      "date": "2026-06-12T10:00:00.000Z"
    }
  }
}
```

---

### بودجه

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/api/budgets` | تعیین سقف بودجه |
| GET | `/api/budgets` | لیست با وضعیت باقی‌مانده |
| PUT | `/api/budgets/:id` | ویرایش |
| DELETE | `/api/budgets/:id` | حذف |

#### POST `/api/budgets`

```json
{ "category": "food", "limit_amount": 500000, "month": "2026-06" }
```

**Response:**
```json
{
  "success": true,
  "message": "بودجه با موفقیت ثبت شد",
  "data": {
    "budget": {
      "id": 1,
      "category": "food",
      "limit_amount": 500000,
      "month": "2026-06",
      "spent": 18500,
      "remaining": 481500,
      "status": "ok"
    }
  }
}
```

اگر بودجه رد شده باشد:
```json
{
  "warning": "بودجه این دسته رد شده است",
  "exceeded_by": 15000,
  "status": "exceeded"
}
```

---

### اهداف پس‌انداز

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/api/goals` | ایجاد هدف |
| GET | `/api/goals` | لیست با درصد پیشرفت |
| PUT | `/api/goals/:id` | ویرایش |
| PATCH | `/api/goals/:id/deposit` | واریز به هدف |
| DELETE | `/api/goals/:id` | حذف |

**انواع هدف:** `house`, `wedding`, `retirement`, `kids`, `other`

#### GET `/api/goals` — Response:

```json
{
  "success": true,
  "data": {
    "goals": [{
      "id": 1,
      "title": "خرید خانه",
      "goal_type": "house",
      "target_amount": 5000000000,
      "current_amount": 1000000000,
      "progress_percent": 20,
      "remaining": 4000000000,
      "motivational_message": "شروع خوبیه! ادامه بده 💪"
    }]
  }
}
```

#### PATCH `/api/goals/:id/deposit`

```json
{ "amount": 500000 }
```

---

### تقویم

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/api/calendar/events` | افزودن رویداد دستی |
| GET | `/api/calendar/events` | رویدادهای آینده |
| GET | `/api/calendar/sync` | همگام‌سازی iCal |
| DELETE | `/api/calendar/:id` | حذف رویداد |

#### POST `/api/calendar/events`

```json
{
  "title": "تولد دوست",
  "estimated_amount": 200000,
  "event_date": "2026-06-20T18:00:00.000Z"
}
```

#### GET `/api/calendar/sync?ical_url=<URL>`

**Response:**
```json
{
  "success": true,
  "message": "تقویم با موفقیت همگام‌سازی شد",
  "data": {
    "events": [
      {
        "title": "جلسه کاری",
        "event_date": "2026-06-15T09:00:00.000Z",
        "source": "ical",
        "estimated_amount": null
      }
    ]
  }
}
```

---

### گزارش‌ها

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/api/reports/dashboard` | داشبورد یک‌نگاه |
| GET | `/api/reports/monthly` | گزارش ماه جاری |
| GET | `/api/reports/balance` | موجودی کل |
| GET | `/api/reports/by-category` | تفکیک هزینه |

#### GET `/api/reports/dashboard`

```json
{
  "success": true,
  "data": {
    "total_balance": 1500000,
    "income_this_month": 2000000,
    "expenses_this_month": 500000,
    "top_spending_category": "food",
    "exceeded_budgets": [],
    "active_goals": [],
    "upcoming_events": [],
    "warnings": []
  }
}
```

---

### سازگاری با فاز ۱

| متد | مسیر | معادل فاز ۲ |
|-----|------|-------------|
| POST | `/api/expenses` | تراکنش با `type=expense` |
| GET | `/api/expenses` | لیست هزینه‌ها |
| GET | `/api/summary` | تفکیک دسته‌بندی |

#### POST `/api/expenses`

```json
{ "title": "ناهار", "amount": 18500, "category": "food" }
```

#### GET `/api/summary`

```json
{
  "success": true,
  "data": {
    "total": 18500,
    "byCategory": { "food": 18500, "transport": 0, "fun": 0, "other": 0 }
  }
}
```

---

## ساختار پایگاه داده

### users
| ستون | نوع | توضیح |
|------|-----|-------|
| id | INTEGER | کلید اصلی |
| email | TEXT | یکتا |
| password | TEXT | هش شده با bcrypt |
| name | TEXT | نام |
| created_at | TEXT | تاریخ ثبت |

### transactions
| ستون | نوع | توضیح |
|------|-----|-------|
| id | INTEGER | کلید اصلی |
| user_id | INTEGER | FK → users |
| type | TEXT | expense / income |
| title | TEXT | عنوان |
| amount | REAL | مبلغ |
| category | TEXT | دسته‌بندی |
| description | TEXT | توضیح |
| receipt_image | TEXT | نام فایل رسید |
| date | TEXT | تاریخ |

### budgets
| ستون | نوع |
|------|-----|
| id, user_id, category, limit_amount, month | — |

### goals
| ستون | نوع |
|------|-----|
| id, user_id, title, goal_type, target_amount, current_amount, target_date | — |

### calendar_events
| ستون | نوع |
|------|-----|
| id, user_id, title, estimated_amount, event_date, source | — |

---

## راهنمای همگام‌سازی تقویم

### Google Calendar

1. به [Google Calendar](https://calendar.google.com) بروید
2. تنظیمات تقویم → **Integrate calendar**
3. لینک **Secret address in iCal format** را کپی کنید
4. درخواست بزنید:
   ```
   GET /api/calendar/sync?ical_url=https://calendar.google.com/calendar/ical/...
   ```
5. رویدادهای ۳۰ روز آینده برگردانده می‌شوند
6. با `POST /api/calendar/events` مبلغ تخمینی اضافه کنید

### Apple Calendar

1. Calendar.app → تقویم مورد نظر → **Get Info**
2. تیک **Public Calendar** را بزنید
3. لینک iCal را کپی کنید
4. همان endpoint همگام‌سازی را فراخوانی کنید

---

## متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `PORT` | 3000 | پورت سرور |
| `JWT_SECRET` | — | کلید امضای JWT (اجباری در production) |
| `DB_PATH` | ./pfm.db | مسیر فایل SQLite |
| `UPLOAD_PATH` | ./uploads/receipts | مسیر ذخیره رسیدها |

---

## تست با Postman

1. `POST /api/auth/register` — ثبت‌نام و دریافت token
2. در تب **Authorization** → Type: **Bearer Token** → token را وارد کنید
3. `POST /api/expenses` — ثبت هزینه
4. `GET /api/summary` — خلاصه
5. `GET /api/reports/dashboard` — داشبورد

---

## دسته‌بندی‌های مجاز

`food` · `transport` · `fun` · `other`

---

## نکات امنیتی

- رمز عبور با bcrypt (saltRounds: 12) هش می‌شود
- همه queryها با prepared statement اجرا می‌شوند
- هر کاربر فقط داده‌های `user_id` خودش را می‌بیند
- در production حتماً `JWT_SECRET` قوی تنظیم کنید
