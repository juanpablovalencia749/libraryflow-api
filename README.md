# 📚 LibraryFlow API

LibraryFlow is a robust, production-ready API built with **NestJS**, **Prisma**, and **SQL Server**. It provides a complete library management system with a strong focus on security, scalability, and maintainability.

---

## ✨ Key Features

- **🔐 Advanced Authentication**
  - JWT Access Tokens (15 min expiration)
  - **HttpOnly Cookies** for Refresh Tokens (secure against XSS)
  - Automatic token rotation and session management

- **📖 Library Management**
  - Full CRUD for Books
  - Pagination and filtering by status
  - Loan system with return tracking
  - Reservation system with automatic queue handling

- **🧾 Audit System**
  - Automatic request/response logging using NestJS Interceptors
  - Tracks actions, entities, and changes (before/after)

- **✅ High Test Coverage**
  - 80%+ coverage
  - Unit and E2E tests

---

## 🏛 Architecture & Design Patterns

The application follows a clean and scalable modular architecture:

1. **Module Pattern**
   - Domain separation: `Auth`, `Books`, `Loans`, `Users`, `Reservations`, `Logger`

2. **Service Abstraction**
   - Business logic is decoupled (e.g., `PasswordService`)
   - Improves testability and maintainability

3. **Interceptor Pattern**
   - `AuditInterceptor` handles logging transparently

4. **Strategy Pattern**
   - Passport JWT strategies for authentication

---

## 🗄️ Data Model

The system is composed of five main entities:

### Main Entities

| Entity | Purpose | Key Fields | Relations |
|--------|--------|------------|----------|
| **User** | Application users and authentication | email, passwordHash, role | Books, Loans, Reservations, AuditLogs |
| **Book** | Library catalog | title, author, status | Loans, Reservations, Creator |
| **Loan** | Borrowing system | loanDate, dueDate, returnedAt | User, Book |
| **Reservation** | Reservation queue system | reservedAt, expiresAt, status | User, Book |
| **AuditLog** | System activity tracking | action, entityName, before/after data | Optional User |

---

### Entity Overview

#### 👤 User
Represents authenticated users.  
Users can create books, borrow books, reserve them, and generate audit logs.

#### 📘 Book
Represents the library catalog.  
Includes metadata such as title, author, and availability status.

#### 🔄 Loan
Represents the borrowing lifecycle of a book.  
Tracks loan date, due date, return date, and status.

#### ⏳ Reservation
Handles reservation queues when books are unavailable.  
Supports expiration, fulfillment, and cancellation.

#### 🧾 AuditLog
Tracks system activity for debugging and accountability.  
Stores before/after state and request metadata.

---

### ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USER {
        int id PK
        string name
        string email UNIQUE
        string passwordHash
        string role
        boolean isActive
        string refreshToken
        datetime refreshTokenExpiresAt
        datetime createdAt
        datetime updatedAt
    }

    BOOK {
        int id PK
        string title
        string author
        int publicationYear
        string status
        string imageUrl
        int createdById FK
        datetime createdAt
        datetime updatedAt
    }

    LOAN {
        int id PK
        int bookId FK
        int userId FK
        datetime loanDate
        datetime dueDate
        datetime returnedAt
        string status
        string notes
        datetime createdAt
        datetime updatedAt
    }

    RESERVATION {
        int id PK
        int bookId FK
        int userId FK
        datetime reservedAt
        datetime expiresAt
        datetime fulfilledAt
        datetime cancelledAt
        string status
        string notes
        datetime createdAt
        datetime updatedAt
    }

    AUDIT_LOG {
        int id PK
        int userId FK
        string entityName
        int entityId
        string action
        string description
        string beforeData
        string afterData
        string ipAddress
        datetime createdAt
    }

    USER |o--o{ BOOK : creates
    USER ||--o{ LOAN : requests
    USER ||--o{ RESERVATION : makes
    USER |o--o{ AUDIT_LOG : generates
    BOOK ||--o{ LOAN : has
    BOOK ||--o{ RESERVATION : has
```

## 🚀 Setup & Execution

### Prerequisites
- **Node.js**: v20 or v24 (Recommended for ESM support)
- **Docker**: For SQL Server container
- **Package Manager**: npm

### 1. Database Setup
```bash
docker-compose up -d
npx prisma db push
npm run seed
```

> **Important**
> 
> After creating a user, make sure to update the `role` field to `ADMIN` in the database to fully access and test all API features.
### 2. Environment Variables (.env)
```env
DATABASE_URL="sqlserver://localhost:1433;database=libraryflow;user=sa;password=Password123;encrypt=true;trustServerCertificate=true"
DB_HOST=localhost
DB_PORT=1433
DB_NAME=libraryflow
DB_USER=sa
DB_PASSWORD=Password123
JWT_SECRET=LibraryFlowSuperSecretKey2024
```

### 3. Running the Server
```bash
npm install
npm run start:dev
```

## 📚 API Documentation (Swagger)
Explore and test the API at:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### Authentication Flow
1. **Login**: `POST /auth/login` - Returns `access_token` and sets an **HttpOnly** `refresh_token` cookie.
2. **Refresh**: `POST /auth/refresh` - Extends session using the secure cookie.
3. **Guard**: Protect endpoints with `@UseGuards(JwtAuthGuard)`.

## ✅ Quality Assurance

### Testing Commands
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`
- **Coverage**: `npm run test:cov`

### Coverage Status
Target achieved: **80%+ Total Project Coverage**.
All core services and controllers are fully tested against edge cases. -->
