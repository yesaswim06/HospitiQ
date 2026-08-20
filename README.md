# 🏥 HOSPITIQ — Smart OPD Queue & Hospital Bed Management System

<p align="center">
  <img src="frontend/public/images/hospitiq_tab_favicon.jpg" alt="HOSPITIQ Logo" width="200" style="border-radius: 36px; box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4);" />
</p>

<p align="center">
  <em>"Smarter Queues. Better Care." — Eliminating OPD Wait Times & Automating Hospital Operations Across India</em>
</p>

<p align="center">
  <a href="https://hospiti-q.vercel.app/"><img src="https://img.shields.io/badge/Frontend-hospiti--q.vercel.app-brightgreen.svg?style=for-the-badge&logo=vercel" alt="Vercel Live Web App" /></a>
  <a href="https://hospitiq.up.railway.app/api/stats"><img src="https://img.shields.io/badge/Backend%20API-hospitiq.up.railway.app-blue.svg?style=for-the-badge&logo=railway" alt="Railway Live REST API" /></a>
  <a href="https://mongodb.com/"><img src="https://img.shields.io/badge/Database-MongoDB%20Atlas-forestgreen.svg?style=for-the-badge&logo=mongodb" alt="MongoDB Atlas" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge" alt="License" /></a>
</p>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌐 Live Deployments & Web Services

- 🌐 **Official Live Web Application (Vercel)**: **[https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)**
- ⚡ **Official Live REST API (Railway)**: **[https://hospitiq.up.railway.app/api](https://hospitiq.up.railway.app/api)**
- 🗄️ **Cloud Database**: **MongoDB Atlas Cluster (`hospitiq`)**

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📌 Executive Summary & Problem Statement

In traditional healthcare systems across India, patients spend up to **3.5 hours** waiting in crowded Outpatient Department (OPD) queues, while hospital staff lack real-time visibility into bed occupancy, doctor consultation dispatching, and emergency admissions.

**HOSPITIQ** resolves this healthcare crisis by implementing a real-time digital OPD token pass system, automated doctor room dispatching, smart bed matrix allocation, AI-driven operational guidance, and contactless patient QR check-ins backed by a robust cloud database.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌟 Key Features & Platform Highlights

### 🎟️ 1. Smart Contactless OPD Token Pass & Live Wait Telemetry
- **Instant Token Generation**: Patients or receptionists generate sequential OPD token passes (`A-031`, `G-111`, `EM-501`).
- **Live Queue Position Tracking**: Real-time counter of patients ahead and estimated wait times (~12 mins/patient).
- **Contactless QR Pass**: Generates high-resolution digital QR code passes for touch-free check-ins at OPD terminals.
- **SMS Notifications Strip**: Live SMS notification sync indicator directly on the patient ticket.

### 🩺 2. Doctor Roster & Consultation Terminal
- **OPD Room Allocations**: Assigns specific OPD rooms (`OPD Room #104 — Cardiology`, `OPD Room #108 — General Medicine`).
- **Priority Triage Dispatch**: Categorizes queues by emergency priority (*🚨 Emergency*, *High Priority*, *Standard*).
- **1-Click Calling & Completion**: Streamlined patient call-next and consultation sign-off workflows.
- **Admin Doctor Management**: Full Add, Edit, and Delete doctor administration directly linked to MongoDB Atlas.

### 🛏️ 3. Hospital 100-Bed Matrix & Ward Admission System
- **Real-Time Ward Tracking**: Live telemetry across **ICU**, **Emergency**, **General Ward**, **Private Ward**, and **Maternity**.
- **Interactive Bed Map**: Visual grid of all 100 hospital beds with color-coded status chips (*Available*, *Occupied*, *Reserved*, *Maintenance*).
- **Interactive Filtering**: Filter the interactive bed map by ward category tabs.
- **Direct Admission & Discharge**: 1-click patient allocation and discharge directly from the bed matrix.

### 📊 4. Executive Operational Reports & Analytics
- **Executive Audit Reports**: Automated audit documents with OPD key performance indicators and ward capacity breakdowns.
- **CSV & PDF Export**: 1-click downloadable CSV dataset and clean printable PDF reports.
- **Weekly Bed Occupancy Trend (%)**: Dual-series charts tracking daily occupancy against hospital target benchmarks.
- **Hourly OPD Footfall**: Visual hourly patient registration flow curve.

### 🤖 5. HOSPITIQ AI Operational Guidance Engine
- **Queue Surge Detection**: Detects department bottlenecks and recommends doctor reallocation.
- **Life Support Optimization**: Monitors ventilator-ready ICU bed ratios and suggests step-down transfers when capacity reaches 75%.
- **Physician Balancing**: Evaluates active vs. available doctor capacity to maintain minimal patient cycle times.

### 👥 6. Role-Based Access Control (RBAC)
- **Patient Portal**: Live wait telemetry, digital QR code pass, token search lookup.
- **Doctor Portal**: Private consultation terminal, room status toggles, patient queue roster.
- **Admin Command Center**: Complete hospital overview, doctor administration, bed management, operational reports, and system settings.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📁 Repository & Project Architecture

```text
HospitiQ/
├── backend/                  # Node.js & Express REST API Service
│   ├── models/               # Mongoose Database Schemas (Token, Doctor, Bed, etc.)
│   ├── server.js             # Express API routes, auth middleware, and controllers
│   ├── db.js                 # MongoDB Atlas Mongoose connection manager
│   ├── seed.js               # Database population script
│   └── package.json          # Backend dependencies
├── public/                   # Client Web Application
│   ├── index.html            # Single-page healthcare application markup
│   ├── css/
│   │   └── styles.css        # Healthcare Glassmorphism Design System
│   └── js/
│       ├── api.js            # REST API client (routes to Railway / Localhost)
│       └── app.js            # State management, view router & chart engine
├── frontend/                 # Synced Vercel Frontend Package
├── README.md                 # Project Documentation
├── package.json              # Monorepo scripts & dependencies
└── vercel.json               # Full-stack Vercel deployment manifest
```

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🛠️ Tech Stack & Technologies Used

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Glassmorphism & Custom Properties), Lucide Icons, Chart.js, QRCode.js
- **Backend**: Node.js, Express.js REST Framework
- **Database**: MongoDB Atlas Cloud (`hospitiq` cluster with Mongoose ORM)
- **Authentication**: JWT-based Role Security (Admin, Doctor, Patient)
- **Deployment**: Vercel (Frontend Client), Railway (Backend REST API)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🔌 API Endpoints Reference

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats` | Public | System-wide queue, bed, and department summary |
| `GET` | `/api/queue` | Public | List active OPD queue tokens |
| `POST` | `/api/queue/token` | Public | Register new patient and generate sequential token |
| `GET` | `/api/patient/:tokenNumber` | Public | Retrieve live wait time and status for token |
| `GET` | `/api/doctors` | Public | List all on-duty doctors and OPD rooms |
| `POST` | `/api/doctors` | Admin | Add new doctor profile to roster and database |
| `PUT` | `/api/doctors/:id` | Admin / Doctor | Update doctor details or room status |
| `DELETE`| `/api/doctors/:id` | Admin | Remove doctor from hospital database |
| `GET` | `/api/beds` | Public | List 100 hospital beds with occupancy status |
| `POST` | `/api/beds/admit` | Admin / Staff | Admit patient to specific ward bed |
| `POST` | `/api/beds/discharge` | Admin / Staff | Discharge patient and free bed |
| `POST` | `/api/beds/recommend` | Public | AI algorithm to recommend beds with ventilator/oxygen |
| `GET` | `/api/insights` | Public | AI operational advice and critical alerts |
| `POST` | `/api/emergency/siren` | Public | Trigger hospital-wide emergency alert siren |

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🚀 Quick Start & Local Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/yesaswim06/HospitiQ.git
cd HospitiQ
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (`.env`)
Create a `.env` file in the root directory:
```ini
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://yesaswim2006_db_user:0pH36096zKU9jmaQ@interndb.scbiasf.mongodb.net/hospitiq?retryWrites=true&w=majority
JWT_SECRET=hospitiq_secure_production_secret_key_88912
HOSPITAL_NAME=HOSPITIQ Central Hospital
```

### 4. Seed MongoDB Atlas Database
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm start
```
Open **`http://localhost:5000`** in your browser!

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 👥 SIH 2026 Innovation Team

| Name | Role |
| :--- | :--- |
| **M N YESASWI BHARGAV (TL)** | Team Lead |
| **RAMCHARAN G** | Frontend Developer |
| **MANJULA B** | UI/UX Designer |
| **MANVITHA N** | Graphic Designer |
| **SUPRIYA A** | Healthcare Researcher |
| **CHARAN TEJA M** | Technology Researcher |

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📧 Support & Contact

- **Customer Care & Support**: `support@hospitiq.org`
- **Official Live Application**: [https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)
- **Official Backend API**: [https://hospitiq.up.railway.app/api](https://hospitiq.up.railway.app/api)
- **Edition**: Smart India Hackathon 2026 (SIH 2026)
- **License**: MIT License
