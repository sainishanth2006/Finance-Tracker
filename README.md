# Personal Finance & Expense Tracker

A modern, full-stack personal finance application built to track daily expenses, manage monthly category budgets, and enforce financial discipline with real-time proactive warnings. 

Standardized for **Indian Rupees (₹ / INR)** and fully containerized into **3 isolated Docker microservices** for zero-setup execution.

---

## Key Features

- **JWT Authentication & User Isolation:** Secure signup and login with token-based authorization and encrypted passwords (`bcryptjs`). Each user's transactions and budgets are completely private.
- **Custom Categories:** Preloaded defaults (Food & Dining, Housing, Utilities, Transportation, etc.) plus custom category creation with color tags.
- **Monthly Category Budgets:** Assign spending limits to categories for any month.
- **Proactive Over-Budget Warning:** As you type an expense amount, the form evaluates current spending against the category budget in real-time, flashing an animated warning showing the exact overage before submission.
- **Dashboard Analytics:**
  - Stat cards: Total Spent, Monthly Budget, and Remaining / Over-Budget balances.
  - Interactive **Recharts Donut Chart** showing category spending distribution.
  - **Top 5 Highest Expenses:** A clean visual leaderboard highlighting your largest individual purchases for the active month.
  - High-priority alert banner when any category budget is exceeded.
- **Indian Rupees (₹):** Localized currency formatting (`en-IN` / `INR`) across all inputs, tables, tooltips, and charts.

---

## Tech Stack & Architecture

The application runs across **3 isolated Docker containers** connected via an internal bridge network:

| Service | Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts | `5173` | Responsive SPA with hot-module reloading and proxy routing. |
| **Backend** | Node.js, Express.js, Mongoose, JWT | `8000` | RESTful API with validation, auth middleware, and aggregation pipelines. |
| **Database** | MongoDB 8 (Official Image) | `27017` | Persistent document storage with Docker named volume (`mongo_data`). |

---

## Quick Start (Using Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Clone the repository
```bash
git clone <repository-url>
cd "Finance tarcker"
```

### 2. Start all services
Run a single command to build and launch all 3 containers:
```bash
docker compose up -d
```

### 3. Open the application
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 4. Stop the application
```bash
docker compose down
```
*(Your data remains safely stored in the persistent Docker volume).*

---

## Running Locally (Without Docker)

If you prefer to run locally without Docker, ensure a local MongoDB instance is running on port `27017`:

```bash
# 1. Install root, server, and client dependencies
npm run install:all

# 2. Start both server and client concurrently
npm run dev
```

- Client will run on: `http://localhost:5173`
- Server will run on: `http://localhost:5001` (proxied by Vite)

---

## Project Structure

```text
.
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable Layout & Nav components
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── lib/api.js          # API client & currency formatting (INR)
│   │   └── pages/              # Dashboard, Expenses, Budgets, Categories, Auth
│   ├── Dockerfile              # Frontend container configuration
│   └── vite.config.js          # Vite config & API proxying
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # DB connection & environment config
│   │   ├── controllers/        # Business logic & aggregation queries
│   │   ├── middleware/         # Auth verification & error handling
│   │   ├── models/             # Mongoose schemas (User, Category, Expense, Budget)
│   │   └── routes/             # RESTful API route definitions
│   └── Dockerfile              # Production Node.js Alpine container
│
├── compose.yaml                # Multi-container orchestration (3 services)
└── README.md
```

---

## API Endpoints Overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Categories:** `GET /api/categories`, `POST /api/categories`, `DELETE /api/categories/:id`
- **Expenses:** `GET /api/expenses?month=YYYY-MM`, `POST /api/expenses`, `DELETE /api/expenses/:id`
- **Budgets:** `GET /api/budgets?month=YYYY-MM`, `POST /api/budgets`, `DELETE /api/budgets/:id`
- **Analytics:** `GET /api/analytics/summary?month=YYYY-MM` (returns total spent, budgets, category split, and top 5 expenses)

<video src=" /Users/sainishanth/Downloads/Screen\ Recording\ 2026-11-08\ at\ 12.00.18 PM.mp4 " controls width="600"></video>