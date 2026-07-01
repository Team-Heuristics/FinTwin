# FinTwin Backend — Fintech Analytics Platform

A production-ready Spring Boot backend for behavioral financial analysis.

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Language      | Java 17                           |
| Framework     | Spring Boot 3.2.3                 |
| Build Tool    | Maven                             |
| Database      | MySQL 8.x                         |
| Security      | Spring Security + JWT (JJWT 0.12) |
| CSV Parsing   | Apache Commons CSV 1.10           |
| ORM           | Spring Data JPA / Hibernate       |
| Validation    | Jakarta Validation                |
| Utilities     | Lombok                            |

---

## Project Structure

```
fintwin-backend/
├── pom.xml
├── README.md
├── src/
│   ├── main/
│   │   ├── java/com/fintwin/
│   │   │   ├── FinTwinApplication.java          # Entry point
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java          # Spring Security + CORS
│   │   │   │   └── GlobalExceptionHandler.java  # Unified error responses
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java          # POST /api/auth/register|login
│   │   │   │   ├── TransactionController.java   # POST /api/transactions/upload
│   │   │   │   ├── AnalyticsController.java     # GET  /api/analytics/*
│   │   │   │   └── DashboardController.java     # GET  /api/dashboard/overview
│   │   │   ├── service/
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── TransactionService.java      # CSV parsing + storage
│   │   │   │   ├── SubscriptionService.java     # Recurring payment detection
│   │   │   │   ├── AnalyticsService.java        # Habit + Credit score engine
│   │   │   │   └── DashboardService.java
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── TransactionRepository.java
│   │   │   │   ├── SubscriptionRepository.java
│   │   │   │   └── AnalyticsResultRepository.java
│   │   │   ├── model/
│   │   │   │   ├── User.java
│   │   │   │   ├── Transaction.java             # Includes TransactionCategory enum
│   │   │   │   ├── Subscription.java
│   │   │   │   └── AnalyticsResult.java
│   │   │   ├── dto/
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── AuthResponse.java
│   │   │   │   ├── TransactionDTO.java
│   │   │   │   ├── SubscriptionDTO.java
│   │   │   │   ├── DashboardOverviewDTO.java
│   │   │   │   ├── UploadResponse.java
│   │   │   │   └── ApiResponse.java             # Generic wrapper
│   │   │   ├── security/
│   │   │   │   ├── JwtUtils.java                # Token gen/validate
│   │   │   │   ├── JwtAuthFilter.java           # Per-request filter
│   │   │   │   ├── JwtAuthEntryPoint.java       # 401 handler
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   └── util/
│   │   │       └── TransactionCategorizationUtil.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── sample_transactions.csv          # Test CSV file
│   └── test/
│       └── java/com/fintwin/
│           └── FinTwinApplicationTests.java
```

---

## Prerequisites

- Java 17+ (`java -version`)
- Maven 3.8+ (`mvn -version`)
- MySQL 8.x running locally

---

## Setup

### 1. Create the MySQL database

```sql
CREATE DATABASE fintwin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure credentials

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 3. Run the application

```bash
mvn spring-boot:run
```

Spring Boot will auto-create all database tables on first startup (`ddl-auto=update`).

The server starts on **http://localhost:8080**

---

## API Reference

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "secret123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "rahul@example.com",
  "password": "secret123"
}
```

Both return:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "email": "rahul@example.com",
    "fullName": "Rahul Sharma"
  }
}
```

> Use the token in all subsequent requests:
> `Authorization: Bearer <token>`

---

### Transactions

#### Upload CSV
```http
POST /api/transactions/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <your CSV file>
```

CSV format:
```csv
date,description,amount
2026-03-01,Swiggy,450
2026-03-02,Netflix,199
2026-03-03,Amazon,1200
```

#### List Transactions
```http
GET /api/transactions
Authorization: Bearer <token>
```

---

### Analytics

#### Subscriptions
```http
GET /api/analytics/subscriptions
Authorization: Bearer <token>
```

#### Financial Habit Score
```http
GET /api/analytics/habit-score
Authorization: Bearer <token>
```

Response:
```json
{
  "data": {
    "score": 74,
    "rating": "Good",
    "savingsRatio": 0.7500,
    "spendingStability": 0.8200,
    "subscriptionWaste": 636.00
  }
}
```

#### Alternative Credit Score
```http
GET /api/analytics/credit-score
Authorization: Bearer <token>
```

Response:
```json
{
  "data": {
    "score": 742,
    "rating": "Very Good",
    "monthlySpending": 12500.00
  }
}
```

---

### Dashboard

#### Overview
```http
GET /api/dashboard/overview
Authorization: Bearer <token>
```

Response:
```json
{
  "data": {
    "financialHabitScore": 74,
    "creditScore": 742,
    "subscriptionWaste": 636.00,
    "monthlySpending": 21314.00,
    "savingsRatio": 0.5737,
    "spendingStability": 0.8100,
    "creditScoreRating": "Very Good",
    "habitScoreRating": "Good",
    "categoryBreakdown": {
      "FOOD": 4980.00,
      "SUBSCRIPTIONS": 1173.00,
      "SHOPPING": 8549.00,
      "TRANSPORT": 2505.00,
      "EDUCATION": 1998.00,
      "MISCELLANEOUS": 109.00
    },
    "subscriptions": [
      { "serviceName": "Netflix", "monthlyAmount": 199.00, "occurrenceCount": 3 },
      { "serviceName": "Spotify", "monthlyAmount": 119.00, "occurrenceCount": 3 }
    ],
    "topTransactions": [ ... ]
  }
}
```

---

## Scoring Algorithms

### Financial Habit Score (0–100)
| Component          | Weight | Description                                  |
|--------------------|--------|----------------------------------------------|
| Savings Ratio      | 40 pts | Higher savings → higher score                |
| Spending Stability | 30 pts | Consistent daily spending → higher score     |
| Subscription Waste | 20 pts | Less subscription waste → higher score       |
| Activity           | 10 pts | Fixed — user has transaction history         |

**Ratings:** 0–39 = Needs Improvement | 40–59 = Fair | 60–79 = Good | 80–100 = Excellent

### Alternative Credit Score (300–900)
Derived from habit score + savings ratio + transaction count – overspending penalty.

**Ratings:** 300–579 = Poor | 580–669 = Fair | 670–739 = Good | 740–799 = Very Good | 800+ = Excellent

### Subscription Detection
Transactions are detected as subscriptions by keyword matching against 20+ known services (Netflix, Spotify, Amazon Prime, Hotstar, Adobe, etc.). Recurring groups (2+ occurrences) are saved as Subscription records with average monthly cost.

### Transaction Categories
| Category      | Keywords (examples)                                   |
|---------------|-------------------------------------------------------|
| FOOD          | swiggy, zomato, dominos, kfc, bigbasket, grocery      |
| SHOPPING      | amazon, flipkart, myntra, nykaa, meesho               |
| TRANSPORT     | uber, ola, metro, petrol, irctc, rapido               |
| EDUCATION     | udemy, coursera, byju, school, college, book          |
| SUBSCRIPTIONS | netflix, spotify, hotstar, adobe, github, jio         |
| MISCELLANEOUS | everything else                                       |

---

## Build & Package

```bash
# Compile and run tests
mvn clean test

# Build executable JAR
mvn clean package -DskipTests

# Run the JAR directly
java -jar target/fintwin-backend-1.0.0.jar
```

---

## Zip for Download

```bash
# From the parent directory of fintwin-backend/
zip -r fintwin-backend.zip fintwin-backend/ \
    --exclude "fintwin-backend/target/*" \
    --exclude "fintwin-backend/.git/*"
```

The zip will be ~50KB (source only, no compiled classes).

---

## Open in IDE

### IntelliJ IDEA
1. File → Open → select the `fintwin-backend/` folder
2. IntelliJ auto-detects Maven — click **Trust Project**
3. Wait for Maven sync to complete
4. Run `FinTwinApplication.java`

### VS Code
1. Install extensions: **Extension Pack for Java**, **Spring Boot Extension Pack**
2. File → Open Folder → select `fintwin-backend/`
3. Open `FinTwinApplication.java` → click ▶ Run

---

## Environment Variables (Optional for Production)

You can override `application.properties` with environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://prod-host:3306/fintwin_db
export SPRING_DATASOURCE_USERNAME=fintwin_user
export SPRING_DATASOURCE_PASSWORD=secure_password
export APP_JWT_SECRET=your_256_bit_secret_key_here
```

---

*Built with ❤️ by FinTwin Engineering*
