# CLAUDE.md — GiveHope Charity Donation Platform
# Project Intelligence File for Claude Code

> This file is the single source of truth for Claude Code.
> Read this ENTIRE file before touching any code, writing any file, or answering any question.
> Do not skip sections. Do not assume. If something conflicts with a user instruction, ask first.

---

## 🧠 What This Project Is

**GiveHope** is a full-stack Charity Donation Platform built with:
- **Backend:** Node.js + Express + Sequelize + MySQL
- **Frontend:** React (Vite) + Zustand + React Query + Framer Motion
- **Payments:** Razorpay (primary) + Stripe (secondary)
- **Email:** SendGrid
- **Auth:** JWT (access token 15min + refresh token 7 days)
- **Docs:** Swagger UI at `/api/v1/docs`
- **Tests:** Jest + Supertest
- **Deployment:** Docker + Docker Compose + AWS

**Goal:** A production-grade, visually stunning, emotionally engaging charity donation website.
NOT a demo. NOT a skeleton. FULLY FUNCTIONAL end-to-end.

---

## 📁 Monorepo Structure

```
charity-donation-platform/
├── src/                        # Backend source
│   ├── config/
│   │   ├── database.js         # Sequelize + MySQL connection
│   │   └── env.js              # Validates all env vars on startup
│   ├── controllers/            # Route handlers (thin — logic in services)
│   ├── middleware/
│   │   ├── auth.js             # verifyToken → attaches req.user
│   │   ├── roles.js            # requireRole(...roles) middleware
│   │   ├── validate.js         # express-validator error handler
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   └── index.js            # All Sequelize models + associations
│   ├── routes/                 # Express routers (one file per domain)
│   ├── services/
│   │   ├── email.service.js    # SendGrid email functions
│   │   ├── payment.service.js  # Razorpay + Stripe logic
│   │   └── notification.service.js
│   ├── utils/
│   │   ├── response.js         # Standard API response helpers
│   │   └── helpers.js          # UUID validator, formatters, etc.
│   ├── templates/
│   │   └── emails/             # HTML email templates (inline CSS)
│   └── app.js                  # Express app setup
├── migrations/                 # Sequelize migrations
├── seeders/                    # Seed: 1 admin + 3 charities
├── tests/                      # Jest + Supertest
├── logs/                       # access.log + error.log (gitignored)
├── server.js                   # Entry point
├── .env                        # Local secrets (gitignored)
├── .env.example                # Template for all env vars
├── frontend/                   # React frontend (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Axios instance (auto-attaches JWT)
│   │   ├── components/
│   │   │   ├── ui/             # Button, Input, Card, Badge, Modal, Spinner, Avatar, ProgressBar
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   └── shared/         # CharityCard, DonationCard, Skeletons
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Charities.jsx
│   │   │   ├── CharityDetail.jsx
│   │   │   ├── DonationCheckout.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── dashboard/
│   │   │       ├── UserDashboard.jsx
│   │   │       ├── CharityDashboard.jsx
│   │   │       └── AdminDashboard.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/
│   │   │   └── authStore.js    # Zustand auth state
│   │   ├── utils/              # Formatters, CSV export, helpers
│   │   └── styles/
│   │       └── globals.css     # CSS variables + global styles
│   ├── .env
│   └── .env.example
├── docker-compose.yml
├── Dockerfile                  # Backend
├── frontend/Dockerfile         # Frontend (nginx)
└── CLAUDE.md                   # ← YOU ARE HERE
```

---

## 🗄️ Database Schema (MySQL via Sequelize)

All primary keys are **UUID v4**. All timestamps use `createdAt`/`updatedAt`.

### Users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | STRING | required |
| email | STRING | unique, required |
| password | STRING | bcrypt hashed, never returned in responses |
| phone | STRING | optional |
| address | TEXT | optional |
| role | ENUM | `user`, `admin` |
| isVerified | BOOLEAN | default false |
| emailVerificationToken | STRING | nullable |
| resetPasswordToken | STRING | nullable |
| resetPasswordExpiry | DATE | nullable |

### Charities
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | STRING | required |
| email | STRING | unique |
| description | TEXT | |
| mission | TEXT | |
| logoUrl | STRING | |
| websiteUrl | STRING | |
| category | ENUM | `education`, `health`, `environment`, `poverty`, `disaster`, `animals`, `other` |
| location | STRING | |
| registrationNumber | STRING | |
| status | ENUM | `pending`, `approved`, `rejected` |
| adminNote | TEXT | rejection reason |
| goalAmount | DECIMAL | |
| raisedAmount | DECIMAL | default 0 |
| userId | UUID | FK → Users (charity admin owner) |

### Projects
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| title | STRING | |
| description | TEXT | |
| targetAmount | DECIMAL | |
| raisedAmount | DECIMAL | default 0 |
| imageUrl | STRING | |
| status | ENUM | `active`, `completed`, `paused` |
| charityId | UUID | FK → Charities |

### Donations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| amount | DECIMAL | required |
| currency | STRING | default `INR` |
| status | ENUM | `pending`, `completed`, `failed`, `refunded` |
| paymentGateway | ENUM | `razorpay`, `stripe` |
| paymentId | STRING | gateway transaction ID |
| paymentOrderId | STRING | Razorpay order ID |
| receiptUrl | STRING | |
| message | TEXT | optional donor message |
| isAnonymous | BOOLEAN | default false |
| userId | UUID | FK → Users |
| charityId | UUID | FK → Charities |
| projectId | UUID | FK → Projects (nullable) |

### ImpactReports
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| title | STRING | |
| content | TEXT | |
| imageUrl | STRING | |
| charityId | UUID | FK → Charities |

### Notifications
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| type | ENUM | `donation_confirmed`, `charity_approved`, `charity_rejected`, `impact_report`, `reminder` |
| message | STRING | |
| isRead | BOOLEAN | default false |
| userId | UUID | FK → Users |

### Associations
```
User hasMany Charities (as charity admin)
User hasMany Donations
User hasMany Notifications
Charity belongsTo User
Charity hasMany Projects
Charity hasMany Donations
Charity hasMany ImpactReports
Project belongsTo Charity
Project hasMany Donations
Donation belongsTo User
Donation belongsTo Charity
Donation belongsTo Project (optional)
```

---

## 🛣️ API Routes Reference

**Base URL:** `/api/v1`
**Auth header:** `Authorization: Bearer <accessToken>`

### Auth `/auth`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | ❌ | Register user/charity_admin |
| POST | `/verify-email` | ❌ | Verify email via token |
| POST | `/login` | ❌ | Login → returns tokens |
| POST | `/refresh-token` | ❌ | Get new access token |
| POST | `/forgot-password` | ❌ | Send reset email |
| POST | `/reset-password` | ❌ | Reset with token |
| POST | `/logout` | ✅ | Invalidate refresh token |

### Users `/users`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/profile` | ✅ | Own profile |
| PUT | `/profile` | ✅ | Update profile |
| PUT | `/change-password` | ✅ | Change password |
| GET | `/donations` | ✅ | Own donation history (paginated) |
| GET | `/donations/:id/receipt` | ✅ | Single receipt |

### Charities `/charities`
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/` | ❌ | any | List approved charities |
| GET | `/:id` | ❌ | any | Single charity detail |
| POST | `/` | ✅ | any | Register charity |
| PUT | `/:id` | ✅ | owner | Update charity |
| POST | `/:id/projects` | ✅ | owner | Add project |
| PUT | `/:id/projects/:pid` | ✅ | owner | Update project |
| GET | `/:id/donations` | ✅ | owner | Charity's donations |
| POST | `/:id/impact-reports` | ✅ | owner | Post impact report |
| GET | `/:id/impact-reports` | ❌ | any | List impact reports |

### Donations `/donations`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/create-order` | ✅ | Create Razorpay order |
| POST | `/verify-payment` | ✅ | Verify + complete donation |
| POST | `/webhook` | ❌ | Razorpay webhook |
| POST | `/stripe/create-intent` | ✅ | Stripe payment intent |
| POST | `/stripe/confirm` | ✅ | Confirm Stripe payment |
| GET | `/:id` | ✅ | Single donation (owner/admin) |

### Admin `/admin`
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | `/charities` | ✅ | admin | All charities |
| PUT | `/charities/:id/approve` | ✅ | admin | Approve charity |
| PUT | `/charities/:id/reject` | ✅ | admin | Reject with note |
| GET | `/users` | ✅ | admin | All users |
| DELETE | `/users/:id` | ✅ | admin | Deactivate user |

### Notifications `/notifications`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ✅ | All notifications (paginated) |
| PUT | `/:id/read` | ✅ | Mark single read |
| PUT | `/read-all` | ✅ | Mark all read |
| GET | `/unread-count` | ✅ | Count unread |

### Utility
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | ❌ | Health check |
| GET | `/docs` | ❌ | Swagger UI |

---

## 🎨 Design System

### Brand Identity
**Name:** GiveHope
**Logo:** Heart-inside-hands SVG icon + "GiveHope" wordmark
**Tagline:** "Your Kindness Can Change a Life Today"
**Feeling:** Warm, trustworthy, human, modern — NOT corporate, NOT generic blue nonprofit

### Color Palette
```css
--color-primary:       #0D6E6E   /* Deep teal — main brand color */
--color-primary-light: #128080   /* Lighter teal — hover states */
--color-primary-dark:  #094F4F   /* Dark teal — footer, hero overlays */
--color-accent:        #F4A535   /* Warm amber — CTAs, highlights */
--color-accent-light:  #FFB84D   /* Light amber — hover on accent */
--color-bg:            #FDF8F0   /* Warm cream — page background */
--color-bg-card:       #FFFFFF   /* White — card backgrounds */
--color-text:          #1A1A2E   /* Near-black — body text */
--color-text-muted:    #6B7280   /* Gray — secondary text */
--color-success:       #22C55E   /* Green — success states */
--color-error:         #EF4444   /* Red — errors */
--color-border:        #E5E7EB   /* Light gray — borders */
--radius-sm:           8px
--radius-md:           16px
--radius-lg:           24px
--shadow-card:         0 4px 24px rgba(0,0,0,0.07)
--shadow-hover:        0 8px 40px rgba(13,110,110,0.15)
```

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** Bold, tight letter-spacing
- **Body:** 16px, 1.6 line-height

### Component Rules
| Component | Rules |
|-----------|-------|
| Button primary | Teal background, white text, rounded-md |
| Button accent | Amber background, dark text, rounded-md |
| Button secondary | Teal border, teal text, transparent |
| Button ghost | No border, teal text |
| Card | White, radius-md, shadow-card, hover → shadow-hover + translateY(-2px) |
| Input | Border gray, focus → teal border + teal ring |
| Badge success | Green bg tint, green text |
| Badge warning | Amber bg tint, amber text |
| Badge error | Red bg tint, red text |

### Animation Rules (Framer Motion)
```js
// Page transition — wrap every page
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -10 }
transition: { duration: 0.3 }

// Card stagger on list pages
staggerChildren: 0.08
childVariants: { hidden: { opacity:0, y:20 }, visible: { opacity:1, y:0 } }

// Button micro press
whileTap: { scale: 0.97 }
```

### Responsive Breakpoints
- Mobile: 375px (sidebar → bottom tab bar, tables → card list)
- Tablet: 768px
- Desktop: 1280px

---

## 🔐 Auth & Security Rules

1. **Passwords** — NEVER returned in any API response. Ever.
2. **JWT** — Access token: 15min. Refresh token: 7 days.
3. **Email verification** — Login blocked if `isVerified: false`.
4. **Role checks:**
   - `user` — can donate, view own profile/donations
   - `charity_admin` (role=`user` but owns a Charity) — can manage their charity
   - `admin` — can manage all users, charities
5. **Charity ownership** — checked by comparing `charity.userId === req.user.id`
6. **Rate limits** — Global: 100 req/15min. Auth routes: 5 req/15min.
7. **Input sanitization** — Strip HTML tags from all text inputs.
8. **UUID validation** — All route params with `:id` must be valid UUID format → 400 if not.

---

## 💳 Payment Flow

### Razorpay (Primary — INR)
```
1. Frontend: User clicks "Donate Now"
2. Frontend → POST /donations/create-order { charityId, amount, projectId?, message, isAnonymous }
3. Backend: Creates Razorpay order, saves Donation { status: pending }
4. Backend → returns { orderId, amount, currency, keyId }
5. Frontend: Opens Razorpay checkout popup with returned details
6. User completes payment on Razorpay UI
7. Razorpay → returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }
8. Frontend → POST /donations/verify-payment { ...razorpay fields, donationId }
9. Backend: Verifies HMAC SHA256 signature
10. If valid: updates Donation { status: completed }, increments charity.raisedAmount, sends email + notification
11. Backend → returns completed donation details
12. Frontend: Shows success screen with confetti
```

### Stripe (Secondary — for international)
```
1. POST /donations/stripe/create-intent → returns clientSecret
2. Frontend uses Stripe.js to confirm payment
3. POST /donations/stripe/confirm → record and complete
```

### Webhook (Razorpay server callback)
- Route: POST `/donations/webhook` — NO auth middleware
- Verify `x-razorpay-signature` header
- Handle `payment.failed` → update donation status

---

## 📧 Email Templates

All in `src/templates/emails/`. Use inline CSS (works in all clients).

| Template | Trigger |
|----------|---------|
| `welcome.html` | User registers |
| `donation-confirmation.html` | Donation status → completed |
| `charity-approved.html` | Admin approves charity |
| `charity-rejected.html` | Admin rejects charity |
| `password-reset.html` | Forgot password request |
| `impact-report.html` | Charity posts impact report (→ all past donors) |

---

## 🖥️ Frontend Pages Reference

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | Home.jsx | ❌ | Landing page |
| `/charities` | Charities.jsx | ❌ | Browse + filter charities |
| `/charities/:id` | CharityDetail.jsx | ❌ | Charity page + donation widget |
| `/donate/:charityId` | DonationCheckout.jsx | ✅ | 3-step donation flow |
| `/about` | About.jsx | ❌ | About page |
| `/contact` | Contact.jsx | ❌ | Contact form |
| `/register` | Register.jsx | ❌ | Register (donor or charity) |
| `/login` | Login.jsx | ❌ | Login |
| `/forgot-password` | ForgotPassword.jsx | ❌ | Request reset |
| `/reset-password` | ResetPassword.jsx | ❌ | Reset with token |
| `/verify-email` | VerifyEmail.jsx | ❌ | Email verification |
| `/dashboard` | UserDashboard.jsx | ✅ user | Donor dashboard |
| `/charity-dashboard` | CharityDashboard.jsx | ✅ charity_admin | Charity management |
| `/admin` | AdminDashboard.jsx | ✅ admin | Platform admin |
| `*` | NotFound.jsx | ❌ | 404 |

---

## 🔧 Environment Variables

### Backend `.env`
```env
# Server
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=givehope_db
DB_USER=root
DB_PASSWORD=yourpassword

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# SendGrid
SENDGRID_API_KEY=SG.xxxxxx
SENDGRID_FROM_EMAIL=noreply@givehope.com
SENDGRID_FROM_NAME=GiveHope

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=xxxxxx
CLOUDINARY_API_KEY=xxxxxx
CLOUDINARY_API_SECRET=xxxxxx
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY=rzp_test_xxxxxx
```

---

## 📦 NPM Packages

### Backend
```json
"dependencies": {
  "express": "^4.18",
  "sequelize": "^6.35",
  "mysql2": "^3.6",
  "bcryptjs": "^2.4",
  "jsonwebtoken": "^9.0",
  "dotenv": "^16.3",
  "cors": "^2.8",
  "helmet": "^7.1",
  "express-rate-limit": "^7.1",
  "morgan": "^1.10",
  "express-validator": "^7.0",
  "uuid": "^9.0",
  "razorpay": "^2.9",
  "stripe": "^14.5",
  "@sendgrid/mail": "^8.1",
  "swagger-jsdoc": "^6.2",
  "swagger-ui-express": "^5.0"
},
"devDependencies": {
  "nodemon": "^3.0",
  "jest": "^29.7",
  "supertest": "^6.3"
}
```

### Frontend
```json
"dependencies": {
  "react": "^18.2",
  "react-dom": "^18.2",
  "react-router-dom": "^6.20",
  "axios": "^1.6",
  "@tanstack/react-query": "^5.8",
  "zustand": "^4.4",
  "react-hook-form": "^7.48",
  "framer-motion": "^10.16",
  "lucide-react": "^0.294",
  "react-hot-toast": "^2.4",
  "recharts": "^2.10",
  "canvas-confetti": "^1.9"
}
```

---

## 🚨 Obsidian Error Log Integration

> Claude Code must log every non-trivial error or bug it encounters to an Obsidian vault.
> This prevents repeating the same mistakes across phases.

### Setup Instructions (Do Once)
1. Install Obsidian on your machine → https://obsidian.md
2. Create a vault named `GiveHope-Dev`
3. Inside the vault, create a folder called `Error Logs`
4. Enable the **Daily Notes** core plugin in Obsidian settings
5. Enable the **Dataview** community plugin (for querying error logs)

### Error Log File Location
Each error gets logged to:
```
GiveHope-Dev/Error Logs/YYYY-MM-DD.md
```

### Error Log Format (Claude Code must use this exact format)

When Claude Code hits an error, bug, or unexpected behavior during any phase,
it must append to the daily error log file using this markdown template:

```markdown
## 🔴 Error #[N] — [Short Title]
**Timestamp:** YYYY-MM-DD HH:MM
**Phase:** Phase [X] — [Phase Name]
**File:** `path/to/file.js` (line [N] if known)
**Category:** [dependency | sequelize | jwt | payment | cors | env | ui | routing | auth | other]

### What Happened
[Plain English description of the error]

### Error Message
```
[Exact error message or stack trace]
```

### Root Cause
[Why it happened — be specific]

### Fix Applied
[Exactly what was changed to fix it]

### Prevention Rule
> ⚠️ [One sentence rule to never repeat this — Claude Code should check this before doing similar things]

---
```

### Obsidian Dashboard Note

Create this file once in the vault: `GiveHope-Dev/Error Dashboard.md`

```markdown
# GiveHope Error Dashboard

## Summary
```dataview
TABLE length(rows) AS "Total Errors", file.day AS "Date"
FROM "Error Logs"
GROUP BY file.day
SORT file.day DESC
```

## All Prevention Rules
```dataview
LIST prevention
FROM "Error Logs"
```

## Errors by Category
```dataview
TABLE category, title, file.day AS date
FROM "Error Logs"
FLATTEN file.lists AS item
WHERE contains(item.task, "Category")
SORT file.day DESC
```
```

### Claude Code Behavior Rules for Error Logging

1. **Log immediately** — as soon as an error is identified and fixed, log it. Don't batch.
2. **Always include the prevention rule** — this is the most important field.
3. **Be specific** — "Sequelize UUID not recognized" not "database error"
4. **Cross-reference** — if a new error is similar to a logged one, reference the old log number
5. **Log warnings too** — if something works but feels fragile, log it as a ⚠️ Warning entry

### Warning Log Format (for fragile/risky code)

```markdown
## ⚠️ Warning #[N] — [Short Title]
**Phase:** Phase [X]
**File:** `path/to/file.js`
**Category:** [same categories as above]

### Risk
[What could go wrong]

### Mitigation Applied
[What was done to reduce the risk]

### Watch Out For
> 👀 [One sentence about what to monitor]

---
```

### Known Error Registry (Pre-filled — Claude Code must read before starting)

These are pre-known pitfalls for this stack. Do NOT make these mistakes:

```markdown
## 🔴 Error #1 — Sequelize UUID Primary Key Not Auto-Generated
**Category:** sequelize
**Prevention Rule:** Always set `defaultValue: DataTypes.UUIDV4` on UUID PKs in model definition AND migration.

## 🔴 Error #2 — JWT Secret Too Short
**Category:** jwt
**Prevention Rule:** JWT secrets must be at minimum 32 characters. Validate length in env.js on startup.

## 🔴 Error #3 — Password Returned in API Response
**Category:** auth
**Prevention Rule:** Always add `attributes: { exclude: ['password'] }` in every Sequelize User query. Never return `user.password`.

## 🔴 Error #4 — Razorpay Signature Verification Failed
**Category:** payment
**Prevention Rule:** Signature = HMAC-SHA256 of `orderId|paymentId` using `key_secret`. Order matters — orderId first, then paymentId.

## 🔴 Error #5 — CORS Blocking Frontend Requests
**Category:** cors
**Prevention Rule:** CORS origin must exactly match frontend URL including protocol. No trailing slash. Use ALLOWED_ORIGINS env variable — never hardcode.

## 🔴 Error #6 — Sequelize Association Not Loaded (N+1)
**Category:** sequelize
**Prevention Rule:** Always use `include: [{ model: X }]` in queries that need associated data. Never lazy-load in loops.

## 🔴 Error #7 — SendGrid From Email Not Verified
**Category:** dependency
**Prevention Rule:** The `from` email in SendGrid must be a verified sender. Verify at sendgrid.com/settings/sender_auth before deploying.

## 🔴 Error #8 — React Query Stale Data After Mutation
**Category:** ui
**Prevention Rule:** Always call `queryClient.invalidateQueries(['key'])` after a mutation that changes server data.

## 🔴 Error #9 — Razorpay Script Not Loaded Before Checkout
**Category:** payment
**Prevention Rule:** Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` to `frontend/index.html`. Check `window.Razorpay` exists before calling.

## 🔴 Error #10 — Migration Run Order Issues
**Category:** sequelize
**Prevention Rule:** Migration filenames must be prefixed with timestamp (e.g., `20240101000001-create-users.js`). FK tables must migrate AFTER their parent tables.

## 🔴 Error #11 — req.user Undefined in Protected Routes
**Category:** auth
**Prevention Rule:** `verifyToken` middleware must be applied BEFORE route handlers that access `req.user`. Order matters in Express middleware chain.

## 🔴 Error #12 — Decimal Precision Lost in JS
**Category:** sequelize
**Prevention Rule:** Use `DECIMAL(10, 2)` in Sequelize, and always parse amounts with `parseFloat()` when doing arithmetic. Never use floating point for currency.

## 🔴 Error #13 — Vite Proxy Not Forwarding Auth Headers
**Category:** ui
**Prevention Rule:** In `vite.config.js`, set `changeOrigin: true` and `secure: false` in the proxy config. Ensure Axios includes `withCredentials: false` for JWT (not cookie-based).

## 🔴 Error #14 — framer-motion AnimatePresence Requires Keyed Children
**Category:** ui
**Prevention Rule:** Each direct child of `<AnimatePresence>` must have a unique `key` prop (use the route pathname) for exit animations to work.

## 🔴 Error #15 — Webhook Signature Check Fails with Body-Parser
**Category:** payment
**Prevention Rule:** Razorpay/Stripe webhooks need raw body for signature verification. Use `express.raw({ type: 'application/json' })` ONLY on the webhook route, NOT `express.json()`.
```

---

## 🏗️ Development Phases Checklist

Use this to track progress. Mark `[x]` when a phase is complete.

```
[ ] Phase 1  — Project Setup & Architecture
[ ] Phase 2  — Database Models & Migrations
[ ] Phase 3  — Authentication APIs
[ ] Phase 4  — User & Charity Management APIs
[ ] Phase 5  — Donation & Payment APIs
[ ] Phase 6  — Notifications & Email System
[ ] Phase 7  — API Documentation & Security Hardening
[ ] Phase 8  — Testing & Deployment Prep
[ ] Phase 9  — Frontend: Project Setup & Design System
[ ] Phase 10 — Frontend: Public Pages
[ ] Phase 11 — Frontend: Auth Pages
[ ] Phase 12 — Frontend: Charity Detail & Donation Flow
[ ] Phase 13 — Frontend: User Dashboard
[ ] Phase 14 — Frontend: Charity Admin & Platform Admin Dashboards
[ ] Phase 15 — Frontend: Polish, Animations & Deployment
```

---

## 📏 Code Standards

### General
- Language: **JavaScript only** — no TypeScript
- Style: **Simple and clean** — no over-engineering
- Comments: Write comments on non-obvious logic only
- No `var` — use `const` and `let` only
- No callback hell — use `async/await` everywhere
- Always handle errors with `try/catch` in async functions

### Backend
- Controllers are thin — business logic goes in services
- All responses use the `response.js` utility:
  ```js
  // Success
  res.status(200).json(successResponse(data, 'Message'))
  // Error
  res.status(400).json(errorResponse('Error message'))
  ```
- All list endpoints return:
  ```json
  { "data": [...], "total": 100, "page": 1, "totalPages": 10, "limit": 10 }
  ```
- UUID validation on all `:id` params — return 400 if invalid format
- Never expose stack traces in production responses

### Frontend
- No class components — functional components + hooks only
- No prop drilling — use Zustand for global state, React Query for server state
- Every API call goes through `src/api/client.js` — no raw fetch() calls
- Loading states: always show skeletons, never blank screens
- Error states: always show user-friendly error messages, never console.error only
- Mobile-first CSS — base styles for mobile, then `@media (min-width: 768px)` for larger

---

## 🔁 Standard API Response Format

```json
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Success with pagination
{
  "success": true,
  "message": "Charities fetched",
  "data": [...],
  "pagination": {
    "total": 45,
    "page": 2,
    "totalPages": 5,
    "limit": 10
  }
}

// Error
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ ... ]  // optional validation errors array
}
```

---

## 🔄 User Journey Flows

### Donor Journey
```
Landing Page → Browse Charities → Charity Detail Page
→ Click "Donate Now" → Login (if not logged in) → Checkout Page
→ Razorpay Popup → Payment → Success Screen (confetti)
→ Email confirmation received → Dashboard shows donation
```

### Charity Journey
```
Register (role: charity_admin) → Verify Email → Login
→ Register Charity (POST /charities) → Status: pending
→ Admin approves → Email notification received → Status: approved
→ Add Projects → Receive Donations → Post Impact Reports
→ Donors get notified of impact reports
```

### Admin Journey
```
Login (role: admin) → Admin Dashboard
→ See pending charities → Review → Approve/Reject
→ Monitor all donations → Manage users
```

---

## ⚠️ Critical Rules — Never Break These

1. **Never return `password` in any API response** — add `exclude: ['password']` to every User query
2. **Never skip email verification check** in login route
3. **Never process a payment without verifying the signature** first
4. **Never run migrations out of order** — timestamps in filenames enforce this
5. **Never hardcode secrets** — always from `process.env`
6. **Never use `app.use(express.json())` on the webhook route** — use raw body parser there
7. **Always validate UUIDs** in route params before querying DB
8. **Always paginate** list endpoints — never return unbounded arrays
9. **Always log errors** to Obsidian immediately after fixing them
10. **Always check the Known Error Registry** before implementing payment, auth, or Sequelize features

---

## 🧪 Testing Setup

- Framework: Jest + Supertest
- Test DB: SQLite (in-memory, separate config)
- Test files: `tests/auth.test.js`, `tests/charity.test.js`, `tests/donation.test.js`
- Mock Razorpay in tests — never hit real payment APIs
- Run: `npm test`

---

## 🐳 Docker Setup

```yaml
# docker-compose.yml services:
# - app: Node.js backend (port 3000)
# - frontend: React/Nginx (port 80)
# - db: MySQL 8.0 (port 3306, persisted volume)
```

---

## 📞 Quick Reference — Where Things Live

| I need to... | Go to... |
|---|---|
| Add a new API route | `src/routes/` → `src/controllers/` → `src/services/` |
| Change DB schema | Create new migration in `migrations/` |
| Add an email template | `src/templates/emails/` + update `email.service.js` |
| Add a new page | `frontend/src/pages/` + add route in `App.jsx` |
| Add a reusable component | `frontend/src/components/ui/` or `shared/` |
| Change global styles | `frontend/src/styles/globals.css` |
| Add global state | `frontend/src/store/` (Zustand) |
| Add a server state query | React Query in the component or custom hook in `hooks/` |
| Log an error | Obsidian vault → `GiveHope-Dev/Error Logs/YYYY-MM-DD.md` |
| Check past errors | Obsidian → `GiveHope-Dev/Error Dashboard.md` |

---

*Last updated: Project initialization*
*Claude Code: Read this file fully at the start of every session. It is your memory.*