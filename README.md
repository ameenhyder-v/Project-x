# Project-x — Full-Stack E-Commerce Platform

A **production-ready**, full-stack e-commerce web application built with **Node.js**, **Express**, **MongoDB**, and **EJS**. It includes a customer storefront, an admin dashboard, payments (Razorpay), OTP-based auth, Google OAuth, PDF invoices, coupons, offers, wallet, returns, and sales reporting.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [Routes Overview](#routes-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Scripts](#scripts)
- [Design Decisions](#design-decisions)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Template Engine** | EJS |
| **Authentication** | express-session, Passport.js (Google OAuth 2.0), bcrypt |
| **Payments** | Razorpay |
| **Invoicing** | EasyInvoice (PDF generation) |
| **Email** | Nodemailer (OTP, notifications) |
| **File Upload** | Multer |
| **Security** | Helmet, express-rate-limit, nocache |
| **Scheduling** | node-cron (expired coupon cleanup) |
| **Reports** | ExcelJS, PDFKit |

---

## Features

### Customer (Storefront)

- **Auth**: Email/password signup and login, OTP verification on signup, forgot password (OTP → change password), Google OAuth.
- **Catalog**: Browse all products; filter by women/men; sort, filter, and search (pagination).
- **Product details**: View product with variants (size, color, stock), images, offers.
- **Cart**: Add/update/remove items, quantity controls, cart count.
- **Checkout**: Multiple addresses, place order with Razorpay (card/UPI) or wallet; coupon apply/remove.
- **Orders**: Order history, order summary, cancel order, return request; retry failed payment; **download PDF invoice**.
- **Account**: Profile edit, change/add password (for Google users), address CRUD, logout.
- **Wishlist**: Add/remove wishlist items.
- **Wallet**: Wallet balance applied at checkout when chosen.

### Admin (Dashboard)

- **Auth**: Admin login (env-based credentials), session protection.
- **Dashboard**: Overview with sales chart (e.g. chart.js).
- **Products**: Product list with block/unblock; add/edit/delete product; remove products with no variants; category check.
- **Variants**: Add/edit/delete variants; multiple images (with Cropper.js), size-wise stock, category/product offer prices.
- **Categories**: List, add, edit categories (gender, description, block).
- **Orders**: List orders, order details, update status; **accept/reject return requests**.
- **Users**: List users, block/unblock, user details.
- **Coupons**: CRUD coupons (code, amount, min order, expiry, status); per-user usage tracking; **cron job** deletes expired coupons daily at midnight.
- **Offers**: Category-level or product-level percentage discounts; applied to variant pricing.
- **Sales report**: Date-range report; **download as PDF or Excel**.

### Security & Production

- **Helmet** (security headers), **compression** (gzip), **rate limiting** (e.g. 200 req/15 min in production).
- **Session**: Configurable secret; in production, secure + httpOnly cookies.
- **Trust proxy** for correct client IP and HTTPS behind reverse proxy.
- **No stack traces** sent to client in production; generic error page.

---

## Project Structure

```
Project-x/
├── app.js                 # Express app, middleware, DB connect, server start
├── passport.js            # Google OAuth strategy and callback URL config
├── package.json
├── .env.example            # Template for environment variables
│
├── Controller/             # Request handlers (MVC)
│   ├── accountController.js   # Profile, addresses, logout, orders list/summary
│   ├── adminController.js     # Admin login, dashboard, productList, orders, users, categories
│   ├── cartController.js      # Add/update/remove cart, cart count
│   ├── categoryController.js  # Category CRUD
│   ├── checkoutController.js  # Checkout, place order, Razorpay, coupon, retry payment
│   ├── coupon-controller.js   # Coupon CRUD + cron for expired coupons
│   ├── invoiceController.js   # EasyInvoice PDF generation and download
│   ├── offerController.js     # Category/product offers
│   ├── orderController.js     # Return, cancel, sales report, chart, PDF/Excel export
│   ├── otpController.js       # Send OTP (nodemailer), verify, forget-password flow
│   ├── productController.js   # Product CRUD, block, edit, delete
│   ├── userController.js      # Register, login, home, product listing, filters, product detail
│   ├── variantController.js   # Variant CRUD, add/edit/delete
│   └── wishlist-controller.js # Wishlist load, add, remove
│
├── Model/                  # Mongoose schemas
│   ├── userModel.js
│   ├── productModel.js
│   ├── variantModel.js
│   ├── categoryModel.js
│   ├── orderModel.js
│   ├── cartModel.js
│   ├── addressModel.js
│   ├── coupon-model.js
│   ├── offerModel.js
│   ├── otpModel.js
│   ├── returnRequestModel.js
│   ├── transactionModel.js
│   └── wishlist-model.js
│
├── middleware/
│   ├── userAuth.js        # isLogin, isLogout, addUserToLocals
│   ├── adminAuth.js       # isLogin, isLogout (admin session)
│   └── multer.js          # File upload config (images)
│
├── routes/
│   ├── userRoute.js       # All customer routes (/, /login, /checkout, /my-orders, etc.)
│   └── adminRoute.js      # All admin routes (/admin/*)
│
├── views/
│   ├── users/             # EJS templates — home, login, register, cart, checkout, orders, account, etc.
│   ├── admin/             # EJS templates — dashboard, productList, orders, users, coupon, offer, etc.
│   └── partials/          # Header, footer (user + admin)
│
├── public/
│   ├── users/assets/      # CSS, JS, images, vendor (Bootstrap, jQuery, Slick, Cropper, etc.)
│   └── admin/             # Admin assets
│
├── images/                # Uploaded product/variant images
└── invoices/              # Generated PDF invoices (if stored on disk)
```

---

## Data Models

| Model | Purpose |
|-------|--------|
| **User** | name, email, password (optional for OAuth), isBlocked, wallet |
| **Product** | name, description, categoryId, brand, material, isBlocked, isVariant, tags |
| **Variant** | productId, color, image[], stock[{ size, quantity }], price, categoryOfferPrice, productOfferPrice, isListed |
| **Category** | category, gender, description, isBlocked |
| **Order** | userId, orderedItems[], shippingAddress, totalAmount, paymentMethod, orderStatus, paymentStatus, couponDiscount, etc. |
| **Cart** | userId, items (variantId, quantity, etc.) |
| **Address** | userId, name, address, country, city, state, pincode, mobile |
| **Coupon** | name, amount, couponCode, minimumAmount, expires, status, userList[] (usage per user) |
| **Offer** | offerName, discountPercentage, selectionType (category/product), selectedItemId |
| **OTP** | email, otp, expiry (for signup and forgot password) |
| **ReturnRequest** | Order returns workflow |
| **Transaction** | Wallet/payment transaction records |
| **Wishlist** | User wishlist items |

---

## Routes Overview

### User routes (prefix `/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Home |
| GET/POST | `/registration` | Signup + OTP verify |
| GET/POST | `/login` | Login |
| GET | `/auth/google`, `/auth/google/callback` | Google OAuth |
| GET/POST | `/forget-password`, `/change-password` | Forgot password flow |
| GET | `/allProducts`, `/women-products`, `/men-products` | Product listings |
| GET | `/products` | Sort/filter/search |
| GET | `/productDetail` | Product detail page |
| POST | `/addToCart` | Add to cart |
| GET | `/shoping-cart` | Cart page; PATCH for quantity/remove |
| GET | `/checkout`, POST `/place-order`, POST `/confirm-payment` | Checkout and Razorpay |
| GET | `/my-orders`, `/order-summary` | Orders; return/cancel, retry payment |
| GET | `/order/invoice/download` | Download invoice PDF |
| GET | `/my-account` | Account; profile, addresses, password |
| GET/POST | `/wishlist`, `/wishlist/add`, `/wishlist/remove` | Wishlist |
| POST | `/coupon/apply`, `/coupon/remove` | Coupon at checkout |

### Admin routes (prefix `/admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/` | Admin login |
| GET | `/dashboard` | Dashboard; `/sales-chart` for chart data |
| GET | `/productList` | Products; POST `/block-product` |
| GET/POST | `/addProduct`, PATCH `/update-product`, DELETE `/delete-product` | Product CRUD |
| GET | `/load-variant`, GET `/add-new-variant` | Variants; POST add/update, DELETE delete |
| GET | `/orders`, `/order-detail` | Orders; PATCH status, return accept/reject |
| GET | `/users`, PUT `/blockUser`, `/userDetails` | Users |
| GET/POST | `/categories`, `/addCategory`, `/update-category` | Categories |
| GET/POST/DELETE | `/coupon`, `/coupon/add`, `/coupon/delete`, `/coupon/update` | Coupons |
| GET/POST/DELETE | `/offer`, `/fetchCategories`, `/fetchProducts`, `/offers/add`, `/offers/delete-offer` | Offers |
| GET | `/sales-report` | Sales report; download PDF/Excel |

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Install and run (development)

```bash
git clone <repo-url>
cd Project-x

# Copy env template and fill in your values
cp .env.example .env
# Edit .env: MONGO_URI, ADMIN_EMAIL, ADMIN_PASS, EMAIL_*, GOOGLE_*, RAZORPAY_*, etc.

npm install
npm start
```

- App runs at **http://localhost:7999** (or `PORT` from `.env`).
- Admin: **http://localhost:7999/admin** (use `ADMIN_EMAIL` / `ADMIN_PASS`).

### First-time setup

1. **MongoDB**: Set `MONGO_URI` (or `MONGO_URI_DEV` if your app uses it) in `.env`.
2. **Admin**: Set `ADMIN_EMAIL` and `ADMIN_PASS` in `.env`.
3. **Email (OTP)**: Set `EMAIL_USER` and `EMAIL_PASS` (e.g. Gmail app password) for signup and forgot-password OTP.
4. **Google OAuth**: Create OAuth 2.0 credentials in Google Cloud Console; set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTHORIZED_URL_LOCAL` (e.g. `http://localhost:7999/auth/google/callback`).
5. **Razorpay**: Create test keys; set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
6. **Invoices**: Optional `EASYINVOICE_API_KEY` and `LOGO_URL`; use `free` or omit for free tier.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | — | `development` \| `production` |
| `PORT` | — | Server port (default `7999`) |
| `SESSION_SECRET` | **Yes (production)** | Long random string for session signing |
| `MONGO_URI` | Dev | MongoDB connection string (or use `MONGO_URI_DEV` / `MONGO_URI_PROD` if app expects them) |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASS` | Yes | Admin login password |
| `EMAIL_USER` | For OTP | SMTP user (e.g. Gmail) |
| `EMAIL_PASS` | For OTP | SMTP password / app password |
| `AUTHORIZED_URL` | Prod OAuth | Google callback URL (production) |
| `AUTHORIZED_URL_LOCAL` | Dev OAuth | Google callback URL (local) |
| `GOOGLE_CLIENT_ID` | OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google OAuth client secret |
| `RAZORPAY_KEY_ID` | Payments | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay key secret |
| `EASYINVOICE_API_KEY` | Optional | `free` or paid API key |
| `LOGO_URL` | Optional | Logo URL for invoices |

See **`.env.example`** for a full template.

---

## Production Deployment

1. **Environment**
   - Set `NODE_ENV=production`.
   - Set **`SESSION_SECRET`** (required; app exits if missing).
   - Set `PORT` if not 7999.
   - Use production MongoDB, admin credentials, email, OAuth callback (`AUTHORIZED_URL`), and Razorpay keys.

2. **Run**
   - Example: `NODE_ENV=production PORT=7999 node app.js`
   - Or: `npm run start:prod` (with `NODE_ENV` and `PORT` set in environment).
   - Prefer a process manager (e.g. **PM2**) for restarts and logging.

3. **Infrastructure**
   - Run behind **HTTPS** (Nginx/Caddy reverse proxy). App uses `trust proxy` and secure cookies when `NODE_ENV=production`.
   - **Helmet**, **compression**, and **rate limiting** are enabled in production.

4. **Google OAuth**
   - In Google Cloud Console, add the **exact** production callback URL (e.g. `https://yourdomain.com/auth/google/callback`).

---

## Free hosting (Render + MongoDB Atlas)

You can run this app for free using **Render** (Node.js) and **MongoDB Atlas** (free M0 cluster).

### 1. MongoDB Atlas (free database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a **free M0 cluster** (e.g. AWS, region nearest to you).
3. Create a database user (username + password). Note them down.
4. **Network Access**: Add **0.0.0.0/0** (allow from anywhere) so Render can connect.
5. **Connect** → “Drivers” → copy the connection string. It looks like:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/DBNAME?retryWrites=true&w=majority`
6. Replace `USER`, `PASS`, and optionally `DBNAME` (e.g. `myStore`). URL-encode the password if it has special characters.

### 2. Push code to GitHub

- Create a repo on GitHub and push your project (ensure `.env` is not committed).
- Render will deploy from this repo.

### 3. Render (free Node.js host)

1. Go to [render.com](https://render.com) and sign up (GitHub login is easiest).
2. **New** → **Web Service**.
3. Connect your GitHub repo and select the **Project-x** repository.
4. Configure:
   - **Name**: e.g. `project-x-store`
   - **Environment**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: **Free**
5. **Environment** (Add Environment Variable). Add every variable your app needs. At minimum:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | (leave empty; Render sets this automatically) |
   | `SESSION_SECRET` | A long random string (e.g. from `openssl rand -hex 32`) |
   | `MONGO_URI_PROD` | Your Atlas connection string from step 1 |
   | `MONGO_URI_DEV` | (optional; can use same as prod for free tier) |
   | `ADMIN_EMAIL` | Your admin login email |
   | `ADMIN_PASS` | Your admin password |
   | `EMAIL_USER` | Your SMTP email (e.g. Gmail) |
   | `EMAIL_PASS` | App password for that email |
   | `AUTHORIZED_URL` | `https://YOUR-RENDER-URL.onrender.com/auth/google/callback` (see below) |
   | `GOOGLE_CLIENT_ID` | From Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
   | `RAZORPAY_KEY_ID` | Your Razorpay key (test keys are fine for demo) |
   | `RAZORPAY_KEY_SECRET` | Your Razorpay secret |

   After the first deploy, Render gives you a URL like `https://project-x-store.onrender.com`. Then set `AUTHORIZED_URL` to `https://project-x-store.onrender.com/auth/google/callback` and add that exact URL in **Google Cloud Console** → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs. Redeploy if you change env vars.

6. Click **Create Web Service**. Render will build and deploy. First deploy may take a few minutes.

### 4. Free-tier limitations

- **Sleep**: After ~15 minutes of no traffic, the free service spins down. The first request after that can take 30–60 seconds (cold start).
- **Disk**: Uploaded product images (e.g. in `images/`) are **ephemeral**—they disappear after a deploy or restart. For a real store, use something like **Cloudinary** (free tier) for image storage later.
- **Cron**: The midnight coupon-cleanup cron only runs when the app is awake; acceptable for demos.
- **Razorpay**: Use **test mode** keys for a free demo; switch to live keys when you go live.

### 5. Other free options

- **Railway**: [railway.app](https://railway.app) — free trial credit; then paid. Good for quick deploys from GitHub.
- **Fly.io**: [fly.io](https://fly.io) — free tier for small VMs; you deploy with `fly launch` and `fly deploy`. Slightly more setup, no “sleep” like Render.

---

## Pre-launch checklist (before going live)

Use this list before making the project live.

### Environment & config
- [ ] **`NODE_ENV=production`** set on the server.
- [ ] **`SESSION_SECRET`** set to a long random string (app exits in prod if missing).
- [ ] **MongoDB**: Use **`MONGO_URI`** (or **`MONGO_URI_PROD`**) with your production DB (e.g. Atlas). Ensure IP/host is allowed in Atlas.
- [ ] **Admin**: Set **`ADMIN_EMAIL`** and **`ADMIN_PASS`** to strong production values (not dev credentials).
- [ ] **`.env`** (and any real secrets) are **not** committed; **`.env`** is in **`.gitignore`**.

### Third-party services
- [ ] **Razorpay**: Switch from test keys to **live keys** (`rzp_live_*`) in dashboard; set **`RAZORPAY_KEY_ID`** and **`RAZORPAY_KEY_SECRET`** in production env.
- [ ] **Google OAuth**: Add your **production** redirect URI (e.g. `https://yourdomain.com/auth/google/callback`) in Google Cloud Console; set **`AUTHORIZED_URL`** in env.
- [ ] **Email (OTP)**: Use production SMTP or a transactional email service; set **`EMAIL_USER`** and **`EMAIL_PASS`** (e.g. app password).

### Security & behaviour
- [ ] App runs behind **HTTPS** (reverse proxy or host’s SSL). Cookies are set to `secure` when `NODE_ENV=production`.
- [ ] **File uploads**: Multer is limited to **5MB per file** and **JPEG/PNG only**. On platforms with ephemeral disk (e.g. Render), uploaded images are lost on restart—consider **Cloudinary** (or similar) for persistent product images.
- [ ] No **passwords**, **API keys**, or **secrets** in logs or in the repo.

### Optional but recommended
- [ ] Run **`npm audit`** and fix critical/high issues where possible.
- [ ] Confirm **404** and **500** behaviour (no stack traces shown to users in production).
- [ ] If using a free host that **sleeps** (e.g. Render free tier), the **midnight cron** (expired coupons) only runs when the app is awake; acceptable for many demos.

---

## Scripts

| Script | Command | Use |
|--------|---------|-----|
| `npm start` | `nodemon app.js` | Development (auto-reload) |
| `npm run start:prod` | `node app.js` | Production (set `NODE_ENV` and `PORT`) |
| `npm test` | — | Placeholder (no tests yet) |

---

## Design Decisions

- **MVC-style layout**: Routes → Controllers → Models; EJS for server-rendered views.
- **Session-based auth**: express-session for user and admin; Passport only for Google OAuth.
- **Product–Variant split**: Products hold metadata; variants hold size/color/stock/price and offer prices for flexible catalog and reporting.
- **Razorpay**: Server creates order; client completes payment; webhook/confirm flow updates order and payment status.
- **Cron**: node-cron runs daily at midnight to delete expired coupons, keeping the DB clean.
- **Production hardening**: Env-driven config, no stack traces to client, rate limiting, and security headers to make the app suitable for deployment and interviews.

---

## License

ISC.
