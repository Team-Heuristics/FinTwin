# FinTwin

FinTwin is a financial analytics platform that helps users upload transaction data, understand spending behavior, detect recurring subscriptions, and review actionable dashboard insights.

The repository contains two runnable applications:

- `fintwin-insights`: a React + Vite frontend dashboard
- `fintwin-backend`: a Spring Boot API service

## What FinTwin Does

- Upload and analyze bank statement CSV files
- Categorize transactions and visualize spending patterns
- Detect recurring subscription payments
- Surface financial health and habit metrics
- Provide authentication-backed user flows for dashboard access

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Chart.js
- Backend: Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, JWT, Apache Commons CSV
- Local Database: H2 for development, with MySQL-ready configuration retained in the backend codebase

## Repository Structure

```text
FINTWIN/
├── fintwin-insights/        # Frontend dashboard
└── fintwin-backend/         # Spring Boot backend
```

## Running Locally

### 1. Start the backend

```bash
cd fintwin-backend/fintwin-backend
mvn spring-boot:run
```

The backend runs on `http://localhost:8080`.

The app is configured to use an in-memory H2 database by default for local development, so no external database is required to start it.

### 2. Start the frontend

```bash
cd fintwin-insights
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Environment Notes

- Backend API base: `http://localhost:8080/api`
- Frontend proxies API requests to the backend during development
- H2 console is enabled at `http://localhost:8080/h2-console`

## Core User Flow

1. Register or log in
2. Upload a transaction CSV
3. Review categorized spend data and subscription patterns
4. Explore dashboard insights and financial metrics

## Sample Data

The repository includes sample CSV files for local testing and UI exploration:

- `fintwin-insights/public/dummy_bank_statement.csv`
- `fintwin-insights/public/dummy_bank_statement_v2.csv`
- `fintwin-backend/fintwin-backend/src/main/resources/sample_transactions.csv`

## Dummy Files To Try

Use the CSV examples below to test the upload flow right away. Save each block as a `.csv` file, then upload it in the dashboard.

### 1. Starter statement

`sample-bank-statement.csv`

```csv
date,description,amount
2026-06-01,Salary Credit,65000
2026-06-02,Netflix,199
2026-06-03,Swiggy,420
2026-06-04,Uber,180
2026-06-05,Amazon,1240
2026-06-06,Spotify,119
2026-06-07,Movie Ticket,350
2026-06-08,Coffee Day,160
```

### 2. Subscription-heavy statement

`sample-subscriptions.csv`

```csv
date,description,amount
2026-06-01,UPI Netflix,199
2026-06-02,UPI Spotify,149
2026-06-03,UPI Prime Video,179
2026-06-04,UPI Gym Membership,999
2026-06-05,UPI Mobile Recharge,299
2026-06-06,UPI Swiggy,512
2026-06-07,UPI Zomato,438
2026-06-08,UPI YouTube Premium,129
```

### 3. Existing repo files you can also use

- `fintwin-insights/public/dummy_bank_statement.csv`
- `fintwin-insights/public/dummy_bank_statement_v2.csv`
- `fintwin-backend/fintwin-backend/src/main/resources/sample_transactions.csv`

These files are already present in the repository and are ready to be downloaded and uploaded through the UI.

## Backend Highlights

- JWT-based authentication
- CSV transaction upload and parsing
- Analytics and dashboard endpoints
- H2-backed local development setup
- Email service wiring with safe defaults for local startup

## Frontend Highlights

- Clean dashboard layout with sidebar and navigation
- Upload flows for transaction data
- Analytics cards and visual summaries
- Subscription and insights views
- Responsive Vite application setup

## API Overview

Common endpoints exposed by the backend include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/transactions/upload`
- `GET /api/transactions`
- `GET /api/analytics/subscriptions`
- `GET /api/analytics/habit-score`
- `GET /api/analytics/credit-score`
- `GET /api/dashboard/overview`

## Troubleshooting

- If the backend does not start, confirm that port `8080` is free.
- If you want to inspect the local database, open the H2 console at `/h2-console`.
- If the frontend cannot reach the API, verify that the backend is running on `http://localhost:8080`.

## Contributing

This project is structured to be easy to extend. Good next additions would be better analytics models, persisted user data, production-grade secrets management, and deployment automation.

## License

No license file is included yet. Add one before public distribution if needed.