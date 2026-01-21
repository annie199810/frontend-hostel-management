🏨 Hostel Management System – Frontend

This repository contains the frontend application of the Hostel Management System, built using React (Vite) and Tailwind CSS.

The application provides a modern, responsive, and role-based user interface for managing hostel operations such as rooms, residents, maintenance, billing, payments, reports, and users.

🚀 Live Application (Frontend)

🔗 Netlify URL
https://hostelmanagementtt.netlify.app

🔐 Demo Credentials (For Evaluation)
👑 Admin Account

Email: admin@hostel.com

Password: admin123

👷 Staff Account

Email: staff@hostel.com

Password: staff123

🔎 Role Behavior
Admin

Full access to all modules

Can create, edit, activate, and deactivate Staff users

Staff

Can manage rooms, residents, maintenance, billing, and reports

Cannot access User Management

ℹ️ Staff users are created only by Admin from the User Management page.

✨ Features (Frontend)
🔐 Authentication & Authorization

JWT-based login system

Token stored securely in localStorage

Protected routes (unauthorized users redirected to Login)

Role-based UI (Admin vs Staff)

🔁 Session Persistence

User session persists across browser refresh

On refresh, the frontend validates the token using the backend
/api/auth/me endpoint

If the token is valid, the user session is restored automatically

🏠 Room Management

Add / Edit / Delete rooms

Room status tracking:

Available

Occupied

Maintenance

Automatic occupancy updates based on resident allocation

Room status is controlled and synchronized with backend enums:
Available → Occupied → Available / Maintenance

Rooms cannot be assigned to multiple residents at the same time

Basic room availability and occupancy checks implemented
(Advanced concurrency handling can be added as a future enhancement)

👤 Resident Management 

Add / Edit / Delete residents

Assign residents to rooms

Track resident status (Active / Inactive)

Automatic room status update:

Room becomes Occupied when a resident is added

Room becomes Available when resident is removed or deactivated

Prevents incorrect room allocation

🔧 Maintenance Management (Frontend)

Raise maintenance requests for rooms

Track issue type (Electrical / Plumbing / Others)

Set priority (High / Medium / Low)

Update request status:

Open

In Progress

Closed

Helps staff track and resolve hostel issues efficiently

💳 Billing & Payments

Create and manage bills

Edit & delete bills

“Pay Now” option

Razorpay payment gateway integration (Test Mode)

Payment status update (Pending → Paid)

Invoice number, due date, and notes

Disabled actions for paid invoices

ℹ️ Razorpay is integrated in test mode for evaluation purposes.

📊 Dashboard & Reports

Total revenue summary

Paid vs pending revenue

Monthly revenue breakdown

Room occupancy overview

Maintenance status analytics

Visual charts and insights

👥 User Management (Admin Only)

Add / Edit / Delete staff users

Activate / Deactivate users

Admin accounts are protected (cannot be deleted)

🎨 UI / UX

Built with Tailwind CSS

Fully responsive (desktop & mobile)

Clean card-based dashboard layout

Reusable UI components:

Cards

Modals

Tables

Forms

Status badges

🛠️ Tech Stack
Frontend

React.js (Vite)

Tailwind CSS

JavaScript (ES6)

Fetch API

JWT Authentication

LocalStorage

Deployment

Netlify

⚙️ Installation & Setup (Frontend)
1️⃣ Clone the Repository
git clone https://github.com/annie199810/frontend-hostel-management.git
cd frontend-hostel-management

2️⃣ Install Dependencies
npm install

3️⃣ Environment Variables

Create a .env file in the root directory:

VITE_API_BASE_URL=http://localhost:5000


For deployed backend:

VITE_API_BASE_URL=https://backend-hostel-management.onrender.com

4️⃣ Run Development Server
npm run dev


Frontend will be available at:
👉 http://localhost:5173

📂 Project Structure
src/
│
├─ api/
│   ├─ auth.js
│   └─ users.js
│
├─ assets/
│   └─ images / icons
│
├─ auth/
│   ├─ AuthProvider.jsx
│   └─ ProtectedRoute.jsx
│
├─ components/
│   ├─ Card.jsx
│   ├─ LoginPage.jsx
│   ├─ RegisterPage.jsx
│   ├─ Sidebar.jsx
│   ├─ StatusModal.jsx
│   └─ Topbar.jsx
│
├─ pages/
│   ├─ AboutPage.jsx
│   ├─ BillingPage.jsx
│   ├─ DashboardPage.jsx
│   ├─ MaintenancePage.jsx
│   ├─ ReportsPage.jsx
│   ├─ ResidentsPage.jsx
│   ├─ RoomsPage.jsx
│   └─ UserManagementPage.jsx
│
├─ utils/
│   └─ auth.js
│
├─ App.jsx
├─ App.css
└─ main.jsx

🔐 Authentication Flow

User logs in using email & password

Backend returns a JWT token

Token is stored in localStorage

All protected API requests include:

Authorization: Bearer <token>


If token is missing or invalid → user is redirected to Login page

🧪 Scripts
npm run dev       # Start frontend locally
npm run build     # Build production files
npm run preview   # Preview production build

📌 Project Scope

This project focuses on clean UI, role-based access control, and core hostel management workflows.
Advanced features such as payment gateway live mode and concurrency locking are intentionally kept as future enhancements.

🔗 Related Repository

🔙 Backend Repository
https://github.com/annie199810/backend-hostel-management