# FinTwin – Intelligent Financial Analytics Platform

FinTwin is a fintech analytics platform that helps **credit-invisible users understand their financial behavior and build alternative credit scores** using transaction data.

The system analyzes bank transaction history to generate financial insights, detect subscription waste, and estimate creditworthiness through behavioral finance analytics.

This project was built as part of a **FinTech Hackathon**.

---

# Problem Statement

Millions of students and young professionals are **credit invisible** because they do not have traditional credit history such as loans or credit cards.

Without a credit score, they face difficulty accessing:

* Small loans
* Financial services
* Credit products

At the same time, many users unknowingly spend money on **unused subscriptions** like streaming services and apps, reducing their monthly savings.

Existing financial tools do not combine **behavior analysis, subscription detection, and alternative credit scoring** in one platform.

---

# Solution

FinTwin analyzes bank transaction data to generate **actionable financial insights**.

It transforms raw transaction history into:

* Financial habit analysis
* Alternative credit scoring
* Subscription waste detection
* Spending analytics dashboard

The platform helps users **improve financial discipline and build financial credibility**.

---

# Key Features

### Transaction Intelligence

* Upload bank statement CSV
* Automatic transaction parsing
* Merchant detection
* Spending categorization

Categories include:

* Food
* Shopping
* Transport
* Education
* Subscriptions
* Miscellaneous

---

### Subscription Waste Detector

Detect recurring subscription payments such as:

* Netflix
* Spotify
* Amazon Prime
* App subscriptions

Features:

* Detect recurring payments
* Calculate monthly subscription spending
* Identify unnecessary subscriptions
* Provide savings recommendations

---

### Financial Habit Score

Generates a **Financial Habit Score (0–100)** based on:

* Spending stability
* Savings ratio
* Subscription waste
* Spending patterns

Example:
Financial Habit Score: **74 / 100**

---

### Alternative Credit Score

FinTwin estimates a **behavioral credit score (300–900)** for users without traditional credit history.

Example:

Credit Score: **742**
Risk Level: **Low**

---

### Financial Insights Dashboard

Interactive dashboard showing:

* Spending distribution
* Monthly spending trends
* Subscription analysis
* Financial habit score
* Alternative credit score

---

# System Architecture

Frontend → React Dashboard
Backend → Spring Boot APIs
Analytics → Python + Pandas
Database → MySQL

Workflow:

1. User uploads transaction CSV
2. Backend parses and categorizes transactions
3. Analytics engine detects patterns
4. Financial scores are generated
5. Dashboard displays insights

---

# Tech Stack

Frontend
React.js
Tailwind CSS
Chart.js

Backend
Spring Boot (Java)

Data Processing
Python + Pandas

Database
MySQL

---

# Project Structure

```
FinTwin
│
├── fintwin-frontend
│   └── React dashboard
│
├── fintwin-backend
│   └── Spring Boot API
│
└── sample-transactions.csv
```

---

# Running the Project

### Backend

```
cd fintwin-backend
mvn spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

### Frontend

```
cd fintwin-frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# Demo Workflow

1. Login to the FinTwin dashboard
2. Upload a bank transaction CSV
3. The system analyzes spending behavior
4. Dashboard displays insights and financial scores

---

# Future Improvements

* Open Banking API integration
* AI financial advisor
* Predictive spending analytics
* Loan eligibility estimator
* Mobile app version

---

# Team

Hackathon Team – Team Heuristics

---

# Impact

FinTwin promotes **financial awareness, responsible spending, and financial inclusion** by helping credit-invisible users build financial credibility using behavioral finance analytics.
