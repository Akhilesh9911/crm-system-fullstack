# 🏢 CRM System - Full Stack

A full-stack CRM (Customer Relationship Management) system built with Java Spring Boot, React.js, Tailwind CSS and MySQL.

## 🎯 Features

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (ADMIN / USER)
- BCrypt password encryption
- Protected routes

### 📊 CRM Modules
- **Lead Management** — Create, update, delete and convert leads to contacts
- **Contact Management** — Manage customer contacts
- **Deal Tracking** — Track deals with stages (Prospecting → Closed Won)
- **Task Management** — Manage tasks with priority and due dates
- **Dashboard** — Real-time statistics and charts
- **Activity Log** — Track all CRM activities
- **Notifications** — In-app notifications

### 👥 User Management (Admin Only)
- Create and manage users
- Assign roles (ADMIN / USER)
- Delete users

## 🏗️ Architecture

```
Frontend  (React 18 + Vite + Tailwind CSS)
    |
    |  HTTP/REST API + JWT
    |
Backend   (Spring Boot 3.2 + Spring Security)
    |
    |  JPA/Hibernate
    |
Database  (MySQL 8.0)
```


## 🎓 Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Security (JWT)
- Spring Data JPA / Hibernate
- MySQL 8.0
- Lombok
- Maven

### Frontend
- React 18
- Vite 5
- React Router v6
- Axios
- Tailwind CSS 3
- Lucide Icons
- React Hot Toast

## 📦 Project Structure

```
crm-system-fullstack/
├── backend/
│   └── src/main/java/com/crm/
│       ├── controller/    (7 REST controllers)
│       ├── service/       (4 business services)
│       ├── repository/    (9 JPA repositories)
│       ├── entity/        (9 JPA entities)
│       ├── dto/           (6 DTOs)
│       └── security/      (JWT + Spring Security)
├── frontend/
│   └── src/
│       ├── pages/         (10 page components)
│       ├── components/    (Reusable UI components)
│       ├── context/       (AuthContext)
│       └── api/           (Axios services)
└── sql/
    └── schema.sql
```


## 🚀 Running Locally

### Prerequisites
- Java 17+
- MySQL 8.0+
- Node.js 18+
- Maven 3.6+

### Step 1: Database Setup
```bash
mysql -u root -p
CREATE DATABASE crm_db;
exit
```

### Step 2: Backend Setup
```bash
cd backend
```

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/crm_db
spring.datasource.username=root
spring.datasource.password=your_mysql_password
jwt.secret=your_jwt_secret_key
```

Run backend:
```bash
mvn clean spring-boot:run
```
✅ Backend runs on http://localhost:8080

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on http://localhost:5173

### Step 4: Login
Open http://localhost:5173

Admin: admin@crm.com / admin123
User: user@crm.com / user123


## 📡 API Endpoints

### Public

POST /api/auth/register Register new user
POST /api/auth/login Login and get JWT token


### Protected (JWT Required)
Leads

GET /api/leads Get all leads
POST /api/leads Create lead
GET /api/leads/{id} Get lead by ID
PUT /api/leads/{id} Update lead
DELETE /api/leads/{id} Delete lead
POST /api/leads/{id}/convert Convert lead to contact

Contacts

GET /api/contacts Get all contacts
POST /api/contacts Create contact

Deals

GET /api/deals Get all deals
POST /api/deals Create deal

Tasks

GET /api/tasks Get all tasks
POST /api/tasks Create task

Dashboard

GET /api/dashboard/stats Get dashboard statistics

Admin Only

GET /api/admin/users Get all users
POST /api/admin/users Create user
DELETE /api/admin/users/{id} Delete user


## 📊 Project Statistics

| Component | Count |
|---|---|
| Backend Java Files | 42 |
| Frontend Components | 20+ |
| Database Tables | 9 |
| API Endpoints | 30+ |

## 🔒 Security Implementation
- JWT tokens with 24hr expiry
- BCrypt password hashing
- Spring Security filter chain
- Role-based endpoint protection
- CORS configuration
