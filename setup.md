# FoodFax Shop Owner Application - Complete Setup Guide

> **Ecosystem:** FoodFax Merchant / Shop Owner Portal  
> **Tech Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Supabase  
> **Last Updated:** October 2026  

---

## 📋 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Local Environment Setup (Mac / Localhost)](#2-local-environment-setup-mac--localhost)
3. [Local Supabase Docker Stack](#3-local-supabase-docker-stack)
4. [Test Merchant Credentials (Seeded Data)](#4-test-merchant-credentials-seeded-data)
5. [Vercel Hosting & Production Deployment](#5-vercel-hosting--production-deployment)
6. [Available npm Scripts](#6-available-npm-scripts)
7. [Troubleshooting & Common Issues](#7-troubleshooting--common-issues)

---

## 1. Overview & Architecture

FoodFax Shop Owner app ek high-performance, real-time merchant portal hai jahan restaurant aur food stall owners:
- Live orders receive karte hain (Realtime WebSocket alerts & loud audio buzzer).
- Order lifecycle manage karte hain (`PENDING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`).
- Menu items aur food categories update karte hain.
- KYC documents aur shop profile verify karate hain.
- Counter tokens manage karte hain (`shop_token_counters`).

---

## 2. Local Environment Setup (Mac / Localhost)

### Prerequisites:
- **Node.js**: v20.x ya v22.x (Recommended: v22 LTS)
- **npm**: v10+
- **Docker Desktop / OrbStack**: Running on your machine (for local Supabase stack)

### Step 1: Repository Clone aur Directory Navigation
```bash
git clone https://github.com/mohitsinghs0/FoodFax-shop.git
cd FoodFax-shop
```

### Step 2: Dependencies Install Karein
Is project me React 19 aur Vite use ho rahe hain. Upstream peer dependency conflict se bachne ke liye repo me already `.npmrc` me `legacy-peer-deps=true` configured hai:
```bash
npm install
```

### Step 3: Environment Configuration (`.env`)
Root folder me `.env` file verify karein. Local development ke liye ye local Supabase Gateway (`http://127.0.0.1:8000`) par point hona chahiye:

```env
# Google Gemini API (Optional)
GEMINI_API_KEY=""

# Application URL
APP_URL="http://localhost:3000"

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY="AIzaSyCy0KAJ11MUKY9sbjL2OSjawwj9D1IPWZM"

# Local Supabase Gateway Endpoint (Envoy)
VITE_SUPABASE_URL="http://127.0.0.1:8000"

# Local Supabase JWT Anon Key
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkyNTE3Njk3LCJleHAiOjE5NTAxOTc2OTd9.m-Kkdq0uf2fr0365ulaLFOW-kWdXO35kaZnJSV_oCwo"

# Local Supabase Publishable Key
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_XETlv-5aDAAmKuBuU1YQTZ_HCGGL2mc"

# Local Supabase Direct Postgres Connection (Pooler)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
```

> [!NOTE]
> Original cloud credentials ka backup [`.env.cloud.bak`](.env.cloud.bak) me surakshit save hai.

### Step 4: Development Server Run Karein
```bash
npm run dev
```
Terminal me output aayega:
```text
  VITE v8.3.1  ready in ~200 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://<your-ip>:3000/
```
Browser me `http://localhost:3000` open karein.

---

## 3. Local Supabase Docker Stack

FoodFax ka backend Mac Mini M2 par local Docker containers ke roop me run karta hai:
- **Envoy Proxy Gateway**: `http://127.0.0.1:8000` (PostgREST, GoTrue, Realtime, Storage route karta hai)
- **PostgreSQL Database (Pooler)**: `127.0.0.1:5432`
- **GoTrue Auth Service**: `http://127.0.0.1:8000/auth/v1`
- **Realtime WebSocket**: `ws://127.0.0.1:8000/realtime/v1`

### Docker Containers Check Karne Ka Command:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Healthy containers list:
- `supabase-envoy` (127.0.0.1:8000)
- `supabase-pooler` (127.0.0.1:5432, 6543)
- `supabase-auth` (GoTrue v2.197.0)
- `supabase-rest` (PostgREST v14.18)
- `realtime-dev.supabase-realtime`
- `supabase-storage`
- `supabase-db` (PostgreSQL 17)

> [!CAUTION]
> Kabhi bhi database reset (`db reset` ya `drop table`) run na karein! Sabhi canonical tables, triggers, aur seed data already configured hain.

---

## 4. Test Merchant Credentials (Seeded Data)

Local testing ke liye database me ek sample active food stall pre-seeded hai:

| Field | Seed Value |
| :--- | :--- |
| **Stall Name** | Mumbai Masala Chaat Stall |
| **Stall ID** | `shop_mumbai_chaat_01` |
| **Owner ID** | `owner_sharma_98200` |
| **Registered Mobile Number** | `+919820011223` (ya `9820011223`) |
| **Owner Email** | `sharma.chaat@foodfax.local` |
| **Default Password** | `Password123!` |
| **Role** | `owner` |
| **KYC Status** | `verified` / `Approved` |
| **Active Status** | `true` |
| **Seeded Categories** | Signature Chaat (`cat_chaat_01`), Refreshing Drinks (`cat_beverages_01`) |
| **Seeded Menu Items** | Sev Puri (₹50), Bhel Puri (₹40), Masala Chaas (₹25) |
| **Token Counter** | `counter_mumbai_chaat_today` (Last token: `100`) |

### Login Steps:
1. `http://localhost:3000` kholein (Login screen appear hogi).
2. **Mobile Number** field me enter karein: `9820011223` (ya `+919820011223`).
3. **Password** field me enter karein: `Password123!`.
4. **Sign In** button click karein.
5. Direct **Dashboard** screen open hogi jahan `Mumbai Masala Chaat Stall` ka live status, menu items, aur orders queue dikhegi.

---

## 5. Vercel Hosting & Production Deployment

App ko [Vercel](https://vercel.com) par host karne ke liye step-by-step process:

### Step 1: GitHub Repository Connect Karein
1. Vercel Dashboard (`vercel.com/dashboard`) par login karein.
2. **"Add New..."** $\rightarrow$ **"Project"** select karein.
3. Apna GitHub repository `FoodFax-shop` import karein.

### Step 2: Build & Output Settings Configure Karein
Vercel automatically project detect karega. Settings confirm karein:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (Default root)
- **Build Command**: `npm run build` (ya `vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

> [!IMPORTANT]
> Repo me `.npmrc` file included hai jisme `legacy-peer-deps=true` set hai. Is se Vercel par `npm install` ke dauran `ERESOLVE esbuild` wala error nahi aayega.

### Step 3: Vercel Environment Variables Configure Karein
Vercel Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables** me ye keys add karein:

| Key | Example Value (Production) | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` ya Tunnel URL | Supabase API URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Public JWT Anon Key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase Publishable Key |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyCy...` | Google Maps Platform Key |
| `APP_URL` | `https://owner.foodfax.in` | Live production domain |
| `GEMINI_API_KEY` | *(Optional)* | Google AI Studio Key |

> [!WARNING]
> Production client app me **kabhi bhi `SERVICE_ROLE_KEY` add na karein**. Sirf `ANON_KEY` aur `PUBLISHABLE_KEY` hi client side par allow hain.

### Step 4: SPA Routing (`vercel.json`)
Vercel par page refresh karne par 404 error na aaye, iske liye repo me [`vercel.json`](vercel.json) configured hai:
```json
{
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 5: Custom Domain Setup (`owner.foodfax.in`)
1. Vercel project me **Settings** $\rightarrow$ **Domains** me jayein.
2. Domain enter karein: `owner.foodfax.in`.
3. Apne DNS provider (Cloudflare, GoDaddy, Namecheap) me CNAME record add karein:
   - **Type**: `CNAME`
   - **Name**: `owner`
   - **Target**: `cname.vercel-dns.com` (ya Vercel dwara diya gaya value)
4. SSL Certificate automatically verify aur issue ho jayega.

---

## 6. Available npm Scripts

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | Dev Server | Local development server start karta hai (`http://localhost:3000`). |
| `npm run build` | Production Build | TypeScript check aur Vite minify bundle create karta hai `dist/` me. |
| `npm run lint` | Typecheck | `tsc --noEmit` run karta hai bina kisi code compilation ke types verify karne ke liye. |
| `npm run preview` | Preview Build | Local build (`dist/`) ko simulate aur preview karne ke liye. |
| `npm run clean` | Clean Artifacts | `dist/` aur temporary server files delete karta hai. |

---

## 7. Troubleshooting & Common Issues

### Issue 1: Vercel par `npm error ERESOLVE could not resolve`
- **Karan**: React 19 aur Vite/Tailwind plugins ke beech esbuild peer dependency mismatch.
- **Solution**: Repo me [`.npmrc`](.npmrc) file maujood hai jisme `legacy-peer-deps=true` set hai. Vercel build command automatically is flag ko read karegi aur build bina error pass ho jayegi.

### Issue 2: "Mobile number is not registered in the database" Error
- **Karan**: Wrong mobile format ya database me record absent hona.
- **Solution**: Phone number hamesha 10 digits (`9820011223`) ya international format (`+919820011223`) me enter karein. Seeded merchant ke liye `9820011223` use karein.

### Issue 3: "Could not find 'order_number' column of 'orders'" Error
- **Karan**: Canonical schema me order ka token column `token_number` hai (na ki `order_number`).
- **Solution**: Codebase me queries aur mappings ko canonical schema ke anuroop update kar diya gaya hai.

### Issue 4: Localhost par CORS ya Network Block
- **Karan**: Docker containers stopped hona ya port 8000 accessible na hona.
- **Solution**: Terminal me check karein `docker ps` run ho raha hai aur `curl http://127.0.0.1:8000/rest/v1/shops` valid response de raha hai.

