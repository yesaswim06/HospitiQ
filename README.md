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
  <img src="https://img.shields.io/badge/SIH-2026%20Project-orange.svg?style=for-the-badge" alt="SIH 2026 Project" />
</p>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌐 Live Deployments & Web Services

- 🌐 **Official Live Web Application (Vercel)**: **[https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)**
- ⚡ **Official Live REST API (Railway)**: **[https://hospitiq.up.railway.app/api](https://hospitiq.up.railway.app/api)**
- 🗄️ **Cloud Database**: **MongoDB Atlas Cluster (`hospitiq`)**

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📌 Executive Summary & Problem Statement

In traditional healthcare systems across India, patients spend up to **3.5 hours** waiting in crowded Outpatient Department (OPD) queues, while hospital staff lack real-time visibility into bed occupancy, doctor consultation dispatching, and emergency admissions.

**HOSPITIQ** resolves this healthcare crisis by implementing an AI-assisted clinical triage engine, a real-time digital OPD token pass system, automated doctor room dispatching, smart bed matrix allocation, operational guidance, 15-day OP data lifecycle management, and contactless patient QR check-ins backed by a robust cloud database.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌟 Key Features & Platform Highlights

### 🤖 1. AI-Assisted Clinical Triage Engine (P1–P5)
- **Natural Language Symptom Parsing**: Evaluates patient-described symptoms, duration, breathing difficulty, consciousness, active bleeding, and severe pain in real time.
- **5-Tier Standard Urgency Classification**:
  - **🚨 P1 – Immediate**: Airway collapse, cardiac arrest, respiratory failure (*0 min wait*).
  - **⚠️ P2 – Emergency**: Acute chest pain, acute stroke protocol, severe dyspnea, active hemorrhage (*< 15 min wait*).
  - **🟡 P3 – Urgent**: High fever with altered vitals, suspected fractures, severe acute pain (*< 30 min wait*).
  - **🔵 P4 – Less Urgent**: Routine outpatient consultations, minor ailments (*Standard OPD queue*).
  - **⚪ P5 – Non-Urgent**: Prescription refills, administrative checkups (*Non-urgent queue*).
- **Visual Analog Pain Scale (VAS 0–10)**: Interactive pain rating slider with live severity indicators.
- **Primary Symptom Category Mapping**: 8 clinical categories (Cardiac, Respiratory, Neurological, Trauma, Abdominal, Orthopedic, Infection, General).
- **Dedicated Emergency Slots**: Auto-allocates critical P1 & P2 patients to fast-track emergency slots (`ER-Bay-01 (Resuscitation Bay)`, `ER-Bay-02 (Cardiac / Trauma Slot)`).
- **Staff Review & Override Terminal**: Dedicated review dashboard for triage nurses/doctors with 1-click confirmation, priority override, and mandatory clinical justification audit trails.

### 🕒 2. Automated 15-Day OP Data Lifecycle & Auto-Erase
- **15-Day Outpatient Validity**: Outpatient (OP) tokens and patient queue records remain active for 15 days from registration.
- **MongoDB Atlas Native TTL Auto-Erase**: Configured with native TTL background indexes (`expireAfterSeconds: 1296000`) to automatically purge expired patient records from the cloud database.
- **Scheduled Background Purge Engine**: Server-side cleanup worker running every 6 hours to guarantee complete privacy compliance and zero stale data retention.
- **Clear Validity Badges**: Displays OP expiration dates across digital token passes and patient directories.

### 🎟️ 3. Smart Contactless OPD Token Pass & Live Wait Telemetry
- **Sequential Token Generation**: Generates department-specific token passes (`A-031`, `G-111`, `EM-501`).
- **Live Queue Position Tracking**: Real-time counter of patients ahead and dynamic wait times calculated from priority weights.
- **Contactless QR Pass**: Generates high-resolution digital QR code passes for touch-free check-ins at OPD terminals.
- **Live Department Queue View**: Real-time list of all waiting patients with active consultation highlights.

### 🩺 4. Doctor Roster & OPD Rooms Management
- **OPD Room Allocations**: Assigns specific OPD rooms (`OPD Room #104 — Cardiology`, `OPD Room #108 — General Medicine`).
- **Priority-Driven Doctor Queue**: Roster sorted strictly by clinical priority (`P1` > `P2` > `P3` > `P4` > `P5`) and waiting time.
- **1-Click Calling & Completion**: Streamlined patient call-next and consultation sign-off workflows.
- **Admin Doctor Profile Manager**: Full Add, Edit, and Delete doctor administration directly linked to MongoDB Atlas.

### 🛏️ 5. Hospital 100-Bed Matrix & Ward Admission System
- **Real-Time Ward Tracking**: Live telemetry across **ICU**, **Emergency**, **General Ward**, **Private Ward**, and **Maternity**.
- **Interactive Bed Map**: Visual grid of all 100 hospital beds with color-coded status chips (*Available*, *Occupied*, *Reserved*, *Maintenance*).
- **Category Filter Tabs**: Instant filtering by ward category.
- **Direct Admission & Discharge**: 1-click patient allocation and discharge directly from the bed matrix.

### 📊 6. Executive Operational Reports & Analytics
- **Executive Audit Reports**: Automated audit documents with OPD key performance indicators and ward capacity breakdowns.
- **CSV & PDF Export**: 1-click downloadable CSV datasets and clean printable PDF reports.
- **Weekly Bed Occupancy Trend (%)**: Dual-series charts tracking daily occupancy against hospital target benchmarks.
- **Hourly OPD Footfall**: Visual hourly patient registration flow curve.

### 👥 7. Role-Based Access Control (RBAC) & Dynamic Themes
- **Patient Portal**: Live wait telemetry, digital QR code pass, token search lookup.
- **Doctor Portal**: Private consultation terminal, room status toggles, priority queue roster.
- **Admin Command Center**: Complete hospital overview, doctor administration, bed management, operational reports, and system settings.
- **Synchronized Theme Switching**: High-contrast Dark Navy Glass and Light Mode support with seamless icon and contrast transitions.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📁 Repository & Project Architecture

```text
HospitiQ/
├── backend/                  # Node.js & Express REST API Service
│   ├── models/               # Mongoose Database Schemas (Token, Patient, Doctor, Bed, etc.)
│   ├── server.js             # Express API routes, NLP triage engine, and controllers
│   ├── db.js                 # MongoDB Atlas Mongoose connection & TTL index manager
│   ├── seed.js               # Database population script
│   └── package.json          # Backend dependencies
├── public/                   # Client Web Application
│   ├── index.html            # Single-page healthcare application markup
│   ├── css/
│   │   └── styles.css        # Healthcare Glassmorphism Design System (Dark & Light)
│   └── js/
│       ├── api.js            # REST API client (routes to Railway / Localhost)
│       └── app.js            # State management, view router, chart engine & triage UI
├── frontend/                 # Synced Vercel Frontend Package
├── README.md                 # Project Documentation
├── package.json              # Monorepo scripts & dependencies
└── vercel.json               # Full-stack Vercel deployment manifest
```

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🛠️ Tech Stack & Technologies Used

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Glassmorphism & Custom Properties), Lucide Icons, Chart.js, QRCode.js
- **Backend**: Node.js, Express.js REST Framework
- **Database**: MongoDB Atlas Cloud (`hospitiq` cluster with Mongoose ORM & Native TTL Indexes)
- **Authentication**: JWT-based Role Security (Admin, Doctor, Patient)
- **Deployment**: Vercel (Frontend Client), Railway (Backend REST API)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🔌 API Endpoints Reference

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats` | Public | System-wide queue, bed, and department summary |
| `GET` | `/api/queue` | Public | List active OPD queue tokens sorted by `finalTriagePriority` |
| `POST` | `/api/queue/token` | Public | Register patient with NLP triage evaluation & 15-day OP validity |
| `POST` | `/api/triage/analyze` | Public | Live client-side NLP triage evaluation (symptoms, pain, category) |
| `GET` | `/api/triage/pending` | Staff / Admin | Fetch unverified triage cases requiring human review |
| `POST` | `/api/triage/override/:id`| Staff / Admin | Confirm or override clinical priority level with reason |
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
| **M N YESASWI BHARGAV (TL)** | Team Lead/Backend Developer |
| **RAMCHARAN G** | Frontend Developer |
| **MANJULA B** | UI/UX Designer |
| **MANVITHA N** | Graphic Designer |
| **SUPRIYA A** | Healthcare Researcher |
| **CHARAN TEJA M** | Technology Researcher |

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📧 Support & Contact

- **Customer Care & Support**: `myselfadmin123@gmail.com`
- **Official Live Application**: [https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)
- **Official Backend API**: [https://hospitiq.up.railway.app/api](https://hospitiq.up.railway.app/api)
- **Edition**: Smart India Hackathon 2026 (SIH 2026)
