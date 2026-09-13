# Bazaaro — Full-Stack E-Commerce Platform 🇮🇳
> *"Sab kuch, ek bazaar mein"*

An enterprise-grade full-stack Indian electronics e-commerce web application built with **React 19**, **TypeScript**, **Express**, **Node.js**, and **MongoDB Atlas**, featuring live catalog grounding with **Google Gemini AI ("Bazaaro AI Dost")**, **ZapUPI Payment Gateway**, and a complete **Admin Management Dashboard**.

---

## 🚀 Key Features

### 🛒 Customer Experience
- **Product Catalog**: Multi-attribute filtering (category, brand, price in ₹ INR, star rating, in-stock status, Made in India).
- **Instant Search & Sort**: Real-time product search and sorting (price low-to-high, high-to-low, customer ratings, discount percentage).
- **Persistent Shopping Cart & Wishlist**: Database-backed cart and wishlist persisted across sessions in MongoDB Atlas.
- **Order Checkout & Coupons**: Multi-step checkout with delivery address validation, BlueDart tracking code generation, and promotional coupon engine (`BAZAARO10`, `DESITECH`, `FIRST500`).
- **ZapUPI Payment Gateway**: Real payment gateway integration with server-side secret handling, payment URL generation, failed payment safety, and automated inventory deduction.
- **Verified Purchaser Reviews**: Authentic customer reviews reserved exclusively for verified buyers who ordered and paid for the item on Bazaaro. Real-time 1–5 star rating aggregation and star distribution.

### 🤖 AI Shopping Guru ("Bazaaro AI Dost")
- **Live MongoDB Catalog Grounding**: Real-time retrieval of products, prices, stock counts, delivery estimates, and hardware specifications directly from MongoDB Atlas.
- **Budget & Need-Based Recommendations**: Natural-language query parsing (e.g. *"Suggest a 5G phone under ₹30,000"*).
- **Honest Availability & Alternatives**: Transparently informs shoppers if a model is out of stock or not carried (e.g. iPhone), suggesting nearest catalog flagships.
- **Interactive Product Cards**: Generated replies contain clickable `[PRODUCT:id]` tags allowing shoppers to view full specs and add items directly to cart.
- **Zero Hallucination & Fallback Protection**: Built-in deterministic database fallback if external AI APIs reach rate limits.

### 🛡️ Admin Dashboard (`/admin`)
- **Real-Time Analytics & KPIs**: Revenue calculated exclusively from verified paid orders, total user counts, active catalog items, pending orders, and low-stock alerts.
- **Product Management**: Add, update, delete, set prices, manage discounts, and control inventory stocks.
- **Category Management**: Create and manage store departments.
- **Order Fulfillment**: Track order status transitions (`Placed` ➔ `Confirmed` ➔ `Packed` ➔ `Dispatched` ➔ `Delivered`).
- **User Management**: View user profiles with order history counts, block/unblock accounts, and last-admin demotion protection.
- **Review Moderation**: View customer reviews across all products and moderate inappropriate feedback.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js, Express.js, esbuild.
- **Database**: MongoDB Atlas via Mongoose.
- **Authentication**: JWT (JSON Web Tokens), bcryptjs password hashing.
- **AI / LLM**: Google Gemini 3.5 Flash-Lite (`@google/genai`).
- **Payment Gateway**: ZapUPI UPI Gateway Integration.

---

## ⚙️ Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster connection string

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/MayankGupta0123/bazaaro-ecommerce.git
   cd bazaaro-ecommerce
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials inside `.env`:
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/bazaaro?retryWrites=true&w=majority"
   GEMINI_API_KEY="your_gemini_api_key"
   GEMINI_MODEL="gemini-3.5-flash-lite"
   ZAPUPI_KEY_ID="your_zapupi_key_id"
   ZAPUPI_ENV="sandbox"
   JWT_SECRET="your_secure_jwt_secret"
   PORT=3000
   NODE_ENV="development"
   PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Default Test Accounts**:
   When launched for the first time, MongoDB automatically seeds demo accounts for testing:
   - **Administrator**: `admin@bazaaro.in` / `Admin@123` (Access `/admin`)
   - **Customer**: `rahul@bazaaro.in` / `Customer@123`

6. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Deployment (Render.com)

Bazaaro is pre-configured for 1-click or Git-based deployment on **[Render.com](https://render.com)** using [`render.yaml`](./render.yaml).

### Deploying to Render:
1. Push your latest code to your **GitHub repository**.
2. Log into the [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
3. Connect your `bazaaro-ecommerce` GitHub repository.
4. Configure the service settings:
   - **Environment**: `Node`
   - **Region**: `Singapore` (Recommended for low latency across India)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, add the required secrets:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = Your MongoDB Atlas connection URI
   - `GEMINI_API_KEY` = Your Google Gemini API Key
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
   - `ZAPUPI_KEY_ID` = Your ZapUPI Key ID
   - `ZAPUPI_ENV` = `sandbox` (or `production`)
   - `JWT_SECRET` = A strong secret string for JWT auth tokens
   - `PUBLIC_BASE_URL` = `https://<your-service-name>.onrender.com`
6. Click **Deploy Web Service**.

### Payment Webhook URL
Once deployed on Render, configure your webhook endpoint in your ZapUPI dashboard:
```
https://<your-service-name>.onrender.com/api/payment/webhook
```

---

## 📄 License
MIT License. Created for the Bazaaro E-Commerce Final Project.