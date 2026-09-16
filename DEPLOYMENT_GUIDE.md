# FlowFix AI — 100% Free Cloud Deployment Guide ($0/Month)

This guide walks you through deploying FlowFix AI completely for free with zero monthly cost using **Neon** (serverless PostgreSQL) and **Render** (cloud container hosting) or **Vercel** (optional decoupled frontend).

---

## Architecture Summary

- **Database**: [Neon.tech](https://neon.tech) — Free serverless PostgreSQL (0.5 GB, never deleted, SSL included).
- **Web App**: [Render.com](https://render.com) — Free Web Service running the multi-stage Docker container (serves both the FastAPI backend and React frontend under one URL).
- **Total Cost**: **$0.00 / month forever**.

---

## Step 1: Create Free PostgreSQL Database on Neon (2 Minutes)

1. Sign up for free at **[https://neon.tech](https://neon.tech)** (you can sign in with GitHub).
2. Click **Create a project**.
   - Project Name: `flowfix-db`
   - Region: Choose the region closest to you (e.g. US East or Frankfurt).
3. Once created, you will see your **Connection Details** on the dashboard.
4. Select **Connection string** and copy the URI. It looks like:
   ```text
   postgresql://flowfix_owner:AbCdEf12345@ep-cool-dawn-123456.us-east-2.aws.neon.tech/flowfix?sslmode=require
   ```
   *(FlowFix automatically normalizes this connection string to `postgresql+psycopg://` at runtime)*.

---

## Step 2: Push Changes to GitHub

Make sure your repository has the latest production files:
```bash
git add .
git commit -m "feat: add production Dockerfile, deployment configs, and cloud hosting adaptations"
git push origin main
```

---

## Step 3: Deploy on Render for Free (3 Minutes)

1. Go to **[https://render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** in the top navigation and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your repository:
   - Repository: `IAMSHIVAM19/Flowfix-Agent`
4. Render will detect the repository settings. Configure as follows:
   - **Name**: `flowfix-platform` (or any name you prefer)
   - **Region**: Choose the same or closest region to your Neon DB
   - **Runtime**: Select **Docker**
   - **Instance Type**: **Free** (0.1 CPU, 512 MB RAM)
5. Scroll down to **Environment Variables** and add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *(Paste your Neon connection string from Step 1)* | Required |
   | `LLM_ENABLED` | `true` | Enables AI diagnosis |
   | `LLM_PROVIDER` | `openrouter` | Cloud LLM provider |
   | `OPENROUTER_API_KEY` | *(Your OpenRouter API key)* | Optional (or use Gemini key) |
   | `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` | Free open LLM |
   | `CORS_ORIGINS` | `*` | Allows cross-origin requests |
6. Click **Deploy Web Service**.

> **What happens automatically:**
> 1. Render builds the React frontend with Node 20 and bundles it into `frontend/dist`.
> 2. Render installs backend Python packages.
> 3. On container start, Alembic automatically executes all schema migrations against your Neon database.
> 4. FlowFix detects the fresh database and auto-seeds the 10 certified trades, 5 technicians, and 35 days of rolling shift availability.
> 5. Your app is live at `https://flowfix-platform.onrender.com`!

---

## Alternative: Decoupled Deployment (Vercel Frontend + Render Backend)

If you prefer hosting the React UI on Vercel:

1. **Deploy Backend to Render**:
   - Follow Step 3, note down your backend URL (e.g. `https://flowfix-backend.onrender.com`).
2. **Deploy Frontend to Vercel**:
   - Go to **[https://vercel.com](https://vercel.com)** and import `IAMSHIVAM19/Flowfix-Agent`.
   - Set **Root Directory** to `frontend`.
   - Framework Preset: `Vite`.
   - Add Environment Variable:
     - `VITE_API_URL`: `https://flowfix-backend.onrender.com`
   - Click **Deploy**.
   - In Render, update `CORS_ORIGINS` to include your Vercel URL (e.g. `https://your-app.vercel.app`).

---

## Default Access & Login Credentials

Once deployed, you can access your hosted application:

| Portal | URL Path | Credentials |
| :--- | :--- | :--- |
| **Operations Command Center** | `/` | Username: `admin`<br>Password: `change-me-now` |
| **Field Technician Portal** | `/technician/login` | Name: `Alex`, `John`, `Sarah`<br>PIN: `1234` |
| **Customer Self-Serve Intake** | `/customer-portal` | Public access (no login required) |
| **API Documentation** | `/docs` | Interactive Swagger UI |
| **Health Check** | `/health` | JSON status endpoint |
