# GiveHope — Charity Donation Platform

A production-grade charity donation platform built with Node.js, React, and MySQL. Supports Razorpay (INR) and Stripe (international) payment gateways with a full donor–charity–admin lifecycle.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + Express 4 |
| ORM | Sequelize 6 + MySQL 8 |
| Auth | JWT (access 15min / refresh 7 days) |
| Payments | Razorpay (primary INR) + Stripe (international) |
| Email | SendGrid |
| Frontend | React 18 + Vite + Zustand + React Query |
| Docs | Swagger UI (`/api/v1/docs`) |
| Tests | Jest + Supertest |
| Deployment | Docker + Docker Compose + AWS |

---

## Local Setup

### Prerequisites

- Node.js 20+
- MySQL 8 running locally (or via Docker)
- A [Razorpay test account](https://dashboard.razorpay.com/) and a [Stripe test account](https://dashboard.stripe.com/)
- A [SendGrid account](https://sendgrid.com/) with a verified sender email

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/givehope.git
cd givehope
npm install
cd frontend && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)
```

### 3. Create the database

```sql
CREATE DATABASE givehope_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations

```bash
npx sequelize-cli db:migrate
```

### 5. Seed the database

Seeds 1 admin user, 3 charity admins, and 3 approved charities.

```bash
npx sequelize-cli db:seed:all
```

**Seeded credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@givehope.com | Admin@123456 |
| Charity Admin 1 | owner1@helpinghands.org | Charity@123456 |
| Charity Admin 2 | owner2@greenearthngo.org | Charity@123456 |
| Charity Admin 3 | owner3@foodforall.org | Charity@123456 |

### 6. Start the backend

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Backend runs at `http://localhost:3000`

### 7. Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

### Backend (`/.env`)

```env
# ── Server ─────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# Comma-separated list of allowed frontend origins (no trailing slash)
ALLOWED_ORIGINS=http://localhost:5173

# Optional: used for generating links in emails. Falls back to first ALLOWED_ORIGINS entry.
FRONTEND_URL=http://localhost:5173

# ── Database ────────────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=givehope_db
DB_USER=root
DB_PASSWORD=yourpassword

# ── JWT ─────────────────────────────────────────────────────────────────────────
# Must be at least 32 characters
JWT_ACCESS_SECRET=your_access_secret_at_least_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_at_least_32_characters_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ── SendGrid ────────────────────────────────────────────────────────────────────
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
# Must be a verified sender in your SendGrid dashboard
SENDGRID_FROM_EMAIL=noreply@givehope.com
SENDGRID_FROM_NAME=GiveHope

# ── Razorpay ────────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
# Set in Razorpay dashboard → Webhooks → Webhook Secret
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx

# ── Stripe ──────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
# Set in Stripe dashboard → Developers → Webhooks → Signing Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# ── Cloudinary (optional — for image uploads) ───────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend (`/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxx
```

---

## Database Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo the most recent migration
npx sequelize-cli db:migrate:undo

# Undo all migrations (drops all tables)
npx sequelize-cli db:migrate:undo:all

# Run seeders
npx sequelize-cli db:seed:all

# Undo seeders
npx sequelize-cli db:seed:undo:all
```

### Migration order

Migrations are timestamp-prefixed to enforce FK-safe order:

| File | Creates |
|------|---------|
| `20260522000001-create-users.js` | `Users` table |
| `20260522000002-create-charities.js` | `Charities` (FK → Users) |
| `20260522000003-create-projects.js` | `Projects` (FK → Charities) |
| `20260522000004-create-donations.js` | `Donations` (FK → Users, Charities, Projects) |
| `20260522000005-create-impact-reports.js` | `ImpactReports` (FK → Charities) |
| `20260522000006-create-notifications.js` | `Notifications` (FK → Users) |
| `20260522000007-add-refresh-token-to-users.js` | Adds `refreshTokenHash` column |
| `20260522000008-add-isActive-to-users.js` | Adds `isActive` column |

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/v1/docs
```

Raw OpenAPI JSON:

```
http://localhost:3000/api/v1/docs.json
```

### Authenticating in Swagger UI

1. Call `POST /auth/login` with valid credentials
2. Copy the `accessToken` from the response
3. Click **Authorize** (top right) → paste the token → **Authorize**
4. All secured endpoints will now include the token automatically

---

## Folder Structure

```
givehope/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize + MySQL connection pool
│   │   ├── env.js               # Validates all required env vars on startup
│   │   ├── sequelize-cli.js     # sequelize-cli path config
│   │   └── swagger.js           # swagger-jsdoc spec definition
│   ├── controllers/             # Thin route handlers — delegate to services
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── charity.controller.js
│   │   ├── donation.controller.js
│   │   ├── admin.controller.js
│   │   └── notification.controller.js
│   ├── middleware/
│   │   ├── auth.js              # verifyToken — attaches req.user
│   │   ├── roles.js             # requireRole(...roles)
│   │   ├── validate.js          # express-validator error formatting
│   │   └── errorHandler.js      # Global error handler + error.log
│   ├── models/
│   │   └── index.js             # All Sequelize models + associations
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── charity.routes.js
│   │   ├── donation.routes.js
│   │   ├── admin.routes.js
│   │   └── notification.routes.js
│   ├── services/                # Business logic — the only layer that touches models
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── charity.service.js
│   │   ├── donation.service.js
│   │   ├── admin.service.js
│   │   ├── notification.service.js
│   │   ├── payment.service.js   # Razorpay + Stripe gateway wrappers
│   │   └── email.service.js     # SendGrid + HTML template rendering
│   ├── templates/
│   │   └── emails/              # Inline-CSS HTML email templates
│   │       ├── welcome.html
│   │       ├── donation-confirmation.html
│   │       ├── charity-approved.html
│   │       ├── charity-rejected.html
│   │       ├── password-reset.html
│   │       └── impact-report.html
│   ├── utils/
│   │   ├── response.js          # successResponse / paginatedResponse / errorResponse
│   │   └── helpers.js           # isValidUUID, parsePagination, stripHtml, formatCurrency
│   └── app.js                   # Express app setup (middleware, routes, Swagger)
├── migrations/                  # Sequelize migration files
├── seeders/                     # Seed data
├── tests/                       # Jest + Supertest
│   ├── auth.test.js
│   ├── charity.test.js
│   └── donation.test.js
├── logs/
│   ├── access.log               # Morgan combined-format request log (gitignored)
│   └── error.log                # Application error log (gitignored)
├── frontend/                    # React + Vite frontend
├── docker-compose.yml
├── Dockerfile
├── server.js                    # Entry point
├── .env.example
└── .sequelizerc
```

---

## Payment Integration

### Razorpay (Primary — INR)

1. Create a [Razorpay test account](https://dashboard.razorpay.com/)
2. Copy **Key ID** and **Key Secret** from Settings → API Keys
3. Set up a webhook at Settings → Webhooks:
   - URL: `https://your-domain.com/api/v1/donations/webhook`
   - Events: `payment.failed`
   - Copy the **Webhook Secret** to `RAZORPAY_WEBHOOK_SECRET`
4. Add your Razorpay Key ID to `frontend/.env` as `VITE_RAZORPAY_KEY`

**Test cards:** Use Razorpay's [test card numbers](https://razorpay.com/docs/payments/payments/test-card-details/).

### Stripe (Secondary — International)

1. Create a [Stripe test account](https://dashboard.stripe.com/)
2. Copy the **Secret Key** (starts with `sk_test_`) from Developers → API Keys
3. Set up a webhook at Developers → Webhooks:
   - URL: `https://your-domain.com/api/v1/donations/stripe/webhook` *(future)*
   - Copy the **Signing Secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`

**Test cards:** Use Stripe's [test card numbers](https://stripe.com/docs/testing).

---

## Running Tests

```bash
npm test
```

Tests use an in-memory SQLite database — no MySQL required. Razorpay and Stripe are mocked.

---

## Docker

```bash
# Start all services (backend + frontend + MySQL)
docker-compose up --build

# Backend only
docker-compose up app db

# Stop everything
docker-compose down
```

Services:
- **app** — Node.js backend on port 3000
- **frontend** — React/Nginx on port 80
- **db** — MySQL 8 on port 3306 (persisted volume)

---

## Security Notes

- **Rate limiting:** Global 100 req/15min · Auth routes 5 req/15min
- **Body size limit:** 10kb for JSON payloads
- **JWT secrets:** Must be ≥ 32 characters — validated on startup
- **Passwords:** Bcrypt 12 rounds — never returned in any response
- **Refresh tokens:** SHA-256 hashed before storage — logout clears the hash
- **Payment signatures:** HMAC-SHA256 verified server-side before completing any donation
- **Webhook bodies:** Raw `Buffer` used for signature verification (not re-serialised JSON)
- **HTML injection:** All user text inputs sanitised with `stripHtml()` before storage
- **CORS:** Enforced from `ALLOWED_ORIGINS` env var — no wildcard in production
