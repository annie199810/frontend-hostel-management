🏨 Hostel Management System – Frontend

This is the frontend application of the Hostel Management System, built using React (Vite) and TailwindCSS.
It provides a modern, responsive UI for managing rooms, residents, billing, maintenance, dashboards, and user accounts.

🚀 Live Frontend (Netlify)

🔗 https://hostelmanagementtt.netlify.app

✨ Features (Frontend)
🔐 Authentication

Login screen with JWT authentication

Token stored in LocalStorage

Redirect protection for private pages

🏠 Room Management

Add / Edit / Delete rooms

Real-time room availability (Available / Occupied / Maintenance)

Auto occupancy update when residents change rooms

👤 Resident Management

Add / Edit / Delete residents

Auto room assignment & check-in date

Room sync (occupancy updates automatically)

🔧 Maintenance Requests

Create / Update / Delete maintenance issues

Track status: Open → In Progress → Closed

Priority handling

💳 Billing & Payments

Add bills

Edit & delete bills

“Pay Now” → status changes to Paid

Invoice number, notes, due date

Disabled actions for paid bills

📊 Dashboard & Reports

Billing summary

Room occupancy chart

Monthly revenue graph

Maintenance statistics

👥 User Management

Add / Edit / Delete staff accounts

Activate / Deactivate user accounts

Admin accounts are protected (cannot delete)

🎨 UI/UX

TailwindCSS for styling

Responsive layout (mobile + desktop)

Clean card-based dashboard

Reusable components (Card, StatusModal, Forms, Tables)

🛠️ Tech Stack

Frontend:

React.js (Vite)

TailwindCSS

JavaScript (ES6)

LocalStorage Auth

Fetch API for backend communication

Deployment:

Netlify

⚙️ Installation & Setup (Frontend)
1️⃣ Clone the repo
git clone https://github.com/annie199810/frontend-hostel-management.git
cd frontend-hostel-management

2️⃣ Install dependencies
npm install

3️⃣ Create a .env file
VITE_API_BASE_URL=http://localhost:5000


For deployed version, Netlify variable is:

VITE_API_BASE_URL=https://backend-hostel-management.onrender.com

4️⃣ Run the development server
npm run dev


Frontend will start at:
👉 http://localhost:5173


src/
│
├─ api/
│   ├─ auth.js
│   └─ users.js
│
├─ assets/
│   └─ (images, icons…)
│
├─ auth/
│   ├─ AuthProvider.jsx
│   └─ ProtectedRoute.jsx
│
├─ components/
│   ├─ AddPaymentModal.jsx
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
├─ App.css
├─ App.jsx
└─ main.jsx

🔐 Authentication Flow (Frontend)

User logs in

Backend returns a JWT

Token saved in localStorage

All private API requests include:

Authorization: Bearer <token>


If token is missing → redirect to Login Page

🧪 Scripts
npm run dev      # Start frontend locally
npm run build    # Create production build
npm run preview  # Preview built version

🧹 Notes

Frontend uses no external UI libraries, only TailwindCSS

Protected routes check for JWT token

Fully responsive design

No company names included (as per requirements)
