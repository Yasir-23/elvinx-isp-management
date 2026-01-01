# ElvinX Radius - ISP Management System

![ElvinX Logo](backend/uploads/1766017860514-logo%20small%20png.png)

**ElvinX Radius** is a comprehensive middleware solution designed to bridge the gap between ISP Administrators and MikroTik RouterOS hardware. It provides a modern, web-based dashboard to manage PPPoE users, bandwidth packages, and billing cycles, ensuring operational safety through a fault-tolerant "Offline Guard" architecture.

---

## 🚀 Key Features

* **User Management:** Create, edit, and sync PPPoE secrets directly to MikroTik.
* **Package Management:** Define bandwidth profiles (e.g., "10Mbps") that map to MikroTik Queue Types.
* **Manual Billing Engine:** Generate invoices, track payment status (Paid/Unpaid), and export professional PDF receipts.
* **Real-Time Monitoring:** Live dashboard showing active sessions, CPU load, and bandwidth usage graphs.
* **Fault Tolerance:** Custom "Guard" middleware prevents database writes if the router is unreachable, preventing data inconsistency.
* **Database Sync:** "Lazy Sync" ensures your local database matches the router's state.

---

## 🛠 Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons, Recharts, jsPDF.
* **Backend:** Node.js, Express.js, JWT Authentication.
* **Database:** MySQL 8.0 (via Prisma ORM).
* **Hardware Integration:** `node-routeros` (TCP API Port 8728).
* **Infrastructure:** Docker & Docker Compose.

---

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:

* **Node.js** (v18+)
* **MySQL** (v8.0+)
* **MikroTik Router** (Optional for UI dev, required for Sync features) with API enabled (`/ip service enable api`).

---

## 🏗️ Installation (Local Development)

### 1. Database Setup
Ensure your local MySQL server is running and you have created a database (e.g., `elvinx_db`).

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure Environment
cp .env.example .env
# Edit .env and set your DATABASE_URL="mysql://root:password@localhost:3306/elvinx_db"

# Run Database Migrations
npx prisma migrate dev --name init

# Create Default Admin (if needed)
node scripts/createAdmin.js

# Start Server
npm run dev

Backend runs on: http://localhost:3000

Frontend Setup

cd frontend

# Install dependencies
npm install

# Start React Dev Server
npm run dev

Frontend runs on: http://localhost:5173

🐳 Installation (Docker)
For a production-ready setup using Docker containers:

Configure Environment: Ensure backend/.env points to the docker service name for the DB: DATABASE_URL="mysql://root:root@db:3306/elvinx_db"

Build and Run: "docker-compose up --build"

Access:

Web Dashboard: http://localhost (Served via Nginx)

API: http://localhost/api

Database: Port 3306

Project Structure

elvinx-radius/
├── backend/                # Express API Server
│   ├── prisma/             # Database Schema & Migrations
│   ├── routes/             # API Endpoints (Users, Invoices, Packages)
│   ├── services/           # MikroTik Bridge & Quota Enforcer
│   └── server.js           # Entry point with Guard Middleware
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── pages/          # Dashboard, Browse Bills, User Profile
│   │   ├── components/     # UI Cards, Modals, Graphs
│   │   └── services/       # Axios API Client
│   └── Dockerfile          # Nginx configurations
│
├── docker-compose.yml      # Container orchestration
└── README.md               # Documentation

🔐 Environment Variables (.env)
Create a .env file in the backend/ folder:

PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/elvinx_db"
JWT_SECRET="your_super_secret_key_change_this"

# Optional: Pre-define Router Credentials (can also be set in Dashboard Settings)
MIKROTIK_HOST=192.168.88.1
MIKROTIK_USER=admin
MIKROTIK_PASS=

🛡️ Fault Tolerance (The "Guard")
The system implements a connection check in server.js. If the MikroTik router is offline, any WRITE operation (Create User, Add Package) will be blocked with a 503 Service Unavailable error. This ensures that you never have "Ghost Users" (users who exist in the database but not in the router).

📄 License
This project is proprietary software developed for ElvinX ISP.