
# Library Management System

---

## 📚 What is this project?
This is a modern, full-stack Library Management System built with a microfrontend and microservice architecture. It is designed as a learning project to demonstrate scalable frontend and backend patterns, authentication, role-based authorization, and seamless integration of multiple technologies.

> **Note:** This LMS was implemented purely for learning and experimentation purposes.

---

## ✨ Features
- **User Authentication:** Secure login with AWS Cognito, JWT-based sessions
- **Role-Based Access:** Member, Staff, and Admin roles with granular permissions
- **Book Catalog:** Search, view, and manage books
- **Borrowing System:** Request, borrow, renew, and return books
- **Notifications:** Real-time notifications for due dates, penalties, and system messages
- **AI Assistant:** Chatbot for help and recommendations
- **Feedback & Requests:** Submit feedback and new book requests
- **Microfrontend Architecture:** Each app is independently deployable and scalable
- **Modern UI:** Responsive, Material-UI based design

---

## 🏗️ Project Structure

### Frontend (Microfrontends)
- **root-config:** Registers and orchestrates all microfrontends (Single-SPA root)
- **container:** Central layout, routing, and access control
- **auth-app:** Login and password management
- **member-portal:** Member dashboard, borrowings, profile, search, feedback
- **staff-portal:** Staff/admin dashboard, book/member management
- **navbar:** Shared navigation bar
- **chat-assistant:** AI-powered chat assistant
- **auth-client:** Shared authentication logic and Zustand store

### Backend Services
- **identity-service:** Authentication, user management, JWT verification
- **catalog-service:** Book, author, and category management
- **circulation-service:** Borrowings, returns, renewals, penalties, notifications
- **gateway:** API gateway for routing and aggregation
- **ai-service:** AI features (chat, recommendations)

---

## 🛠️ Technologies Used

- **Frontend:**
  - React 17
  - Single-SPA (microfrontends)
  - Zustand (global state)
  - React Hook Form & Zod (forms/validation)
  - Material-UI
  - React Router
- **Backend:**
  - Node.js
  - Express
  - Apollo Server (GraphQL)
  - Prisma ORM
  - AWS Cognito (Auth)
  - JWT


---

# 🚀 Getting Started

## 1. Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- PostgreSQL (for Prisma)
- AWS Cognito User Pool (or use mock for dev)


## 2. Environment Variables
Each service/app has its own `.env` file. Below are the required variable names for each:

### **backend/identity-service/.env**
```
DATABASE_URL
COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
COGNITO_ISSUER
```

### **backend/catalog-service/.env**
```
DATABASE_URL
COGNITO_ISSUER
```

### **backend/circulation-service/.env**
```
DATABASE_URL
COGNITO_ISSUER
```

### **backend/ai-service/.env**
```
GROQ_API_KEY
PORT
GATEWAY_URL
```

### **frontend/auth-app/.env**
```
REACT_APP_COGNITO_USER_POOL_ID
REACT_APP_COGNITO_CLIENT_ID
REACT_APP_AWS_REGION
```

### **frontend/auth-client/.env**
```
REACT_APP_COGNITO_USER_POOL_ID
REACT_APP_COGNITO_CLIENT_ID
REACT_APP_AWS_REGION
```

---

## 3. Running the Project

### 1. Start Backend Services
Open separate terminals for each service:

```bash
# identity-service
cd backend/identity-service
npm install
npm run migrate
npm run dev

# catalog-service
cd backend/catalog-service
npm install
npm run migrate
npm run dev

# circulation-service
cd backend/circulation-service
npm install
npm run migrate
npm run dev

# ai-service
cd backend/ai-service
npm install
npm run dev

# gateway
cd backend/gateway
npm install
npm run dev
```

**Default Ports:**
- gateway: `4000`
- identity-service: `4001`
- catalog-service: `4002`
- circulation-service: `4003`
- ai-service: `4004`

### 2. Start Frontend Apps
Open separate terminals for each app:

```bash
# root-config
cd frontend/root-config
npm install
npm start

# container
cd frontend/container
npm install
npm start

# auth-app
cd frontend/auth-app
npm install
npm start

# member-portal
cd frontend/member-portal
npm install
npm start

# staff-portal
cd frontend/staff-portal
npm install
npm start

# navbar
cd frontend/navbar
npm install
npm start

# chat-assistant
cd frontend/chat-assistant
npm install
npm start
```

**Default Frontend Ports:**
- root-config: `9000`
- container: `9001`
- auth-app: `9002`
- member-portal: `9003`
- staff-portal: `9004`
- navbar: `9005`
- chat-assistant: `9006`

---

## 4. Usage Flow

### 👤 Normal User
1. Register or login via **auth-app** (Cognito)
2. Access **member-portal** for dashboard, search, borrowings, profile
3. Use **chat-assistant** for help
4. Submit feedback or new book requests
5. Receive notifications for due dates, penalties, etc.

### 🛡️ Admin/Staff
1. Login via **auth-app**
2. Access **staff-portal** for book/member management
3. Approve/decline new book requests
4. Manage borrowings, returns, and penalties
5. View system notifications and feedback

---

## 📝 Notes & Tips
- Make sure all backend services are running before starting frontend apps.
- Update `.env` files with correct database URLs, secrets, and API endpoints.
- For development, you can use local PostgreSQL and mock Cognito if needed.
- Use `npm run migrate` in backend services to apply Prisma migrations.
- All apps are independent; you can develop and deploy them separately.

---

This project is for learning and experimentation only. 

---

Enjoy exploring and learning with this Library Management System! 🚀
