# 🏥 HOSPITIQ — Smart OPD Queue & Hospital Bed Management System

<p align="center">
  <img src="frontend/public/images/hospitiq_tab_favicon.jpg" alt="HOSPITIQ Logo" width="200" style="border-radius: 36px; box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4);" />
</p>

<p align="center">
  <em>"Smarter Queues. Better Care." — Eliminating OPD Wait Times & Automating Hospital Operations Across India</em>
</p>

<p align="center">
  <a href="https://hospiti-q.vercel.app/"><img src="https://img.shields.io/badge/Frontend-hospiti--q.vercel.app-brightgreen.svg?style=for-the-badge&logo=vercel" alt="Vercel Live Web App" /></a>
  <a href="https://hospitiq.onrender.com/api/queue"><img src="https://img.shields.io/badge/Backend%20API-hospitiq.onrender.com-blue.svg?style=for-the-badge&logo=render" alt="Render Live REST API" /></a>
</p>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌐 Live Deployments & Web Services
- 🌐 **Official Live Web Application (Vercel)**: **[https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)**
- ⚡ **Official Live REST API (Render)**: **[https://hospitiq.onrender.com/api/queue](https://hospitiq.onrender.com/api/queue)**

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📌 Executive Summary & Problem Statement

In traditional healthcare systems across India, patients spend up to **3.5 hours** waiting in crowded Outpatient Department (OPD) queues, while hospital staff lack real-time visibility into bed occupancy, doctor consultation dispatching, and emergency admissions.

**HOSPITIQ** resolves this healthcare crisis by implementing a real-time digital OPD token pass system, automated doctor room dispatching, smart bed matrix allocation, and contactless patient QR check-ins.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌟 Key Features & Platform Highlights

### 🎟️ 1. Smart Contactless OPD Token Pass
- **Instant Token Generation**: Patients or receptionists generate sequential OPD token passes (`A-031`, `B-014`).
- **Live Wait Time Forecasting**: AI algorithms dynamically compute wait times based on historical doctor consultation speeds.
- **Contactless QR Pass**: Generates digital QR code passes printable or viewable on smartphones.

### 🩺 2. Doctor Consultation Terminal
- **Priority Triage Dispatch**: Categorizes patient queues by emergency level (*Emergency*, *High Priority*, *Standard*).
- **Vitals Monitoring Chips**: Displays real-time patient vitals (*Pulse*, *BP*, *Temp*).
- **1-Click Patient Calling**: Directs patients to assigned OPD consultation rooms (`OPD Room #104 — Cardiology`).

### 🛏️ 3. Hospital 100-Bed Matrix & Ward Admission System
- **Real-Time Ward Monitoring**: Live tracking of ICU, Emergency, General, Private, Semi-Private, Pediatric, and Maternity wards.
- **Interactive Bed Map**: Visual grid status (*Occupied*, *Vacant*, *Under Cleaning*).
- **Dedicated Ward Admission**: Admit patients directly into available ward beds with attending doctor assignment and diagnosis tracking.

### 👥 4. Role-Based Access Control (3 Distinct User Portals)
- **Patient Portal**: Live wait-time counter, digital QR code pass, SMS/WhatsApp alert status.
- **Doctor Portal**: Consultation terminal, room status toggles, patient calling, inline OPD registration.
- **Admin Command Center**: Executive capacity gauges, doctor CRUD administration, inpatient directory, analytics, and settings.

### 🚨 5. Emergency Siren & System Alerts
- **1-Click Hospital Siren**: Triggers hospital-wide emergency alert protocols across all connected terminals.
- **Theme-Reactive UI**: Supports sleek dark mode and high-contrast light mode.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📁 Repository & Project Architecture

```text
HospitiQ/
├── backend/                  # Express REST API & MongoDB Cloud Service
│   ├── server.js             # REST API endpoints & route controllers
│   ├── db.js                 # MongoDB Mongoose connection & dataset fallback
│   ├── package.json           # Backend dependencies
│   ├── vercel.json            # Vercel serverless routing
│   └── .env.example           # Environment variables
├── frontend/                 # Client Web Application
│   ├── package.json           # Frontend npm scripts
│   ├── vercel.json            # Static hosting config
│   └── public/
│       ├── index.html        # Single-page multi-view markup
│       ├── css/
│       │   └── styles.css    # Healthcare Glassmorphic Design System
│       └── js/
│           ├── api.js        # REST API fetch client (Render & Vercel gateway)
│           └── app.js        # Dynamic UI state engine & router
├── HOSPITIQ_Wall_QR_Poster.jpg # Printable Hospital Wall QR Poster Asset
├── README.md                 # Documentation
├── package.json              # Monorepo dependencies & scripts
└── vercel.json               # Full-stack Vercel deployment manifest
```

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🛠️ Tech Stack & Technologies Used

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Glassmorphism & CSS Variables), Lucide Vector Icons
- **Backend**: Node.js, Express.js REST Framework
- **Database**: MongoDB Atlas Cloud (`Cluster0`) with high-performance memory dataset fallback
- **Frontend Deployment**: Vercel (`https://hospiti-q.vercel.app/`)
- **Backend Deployment**: Render (`https://hospitiq.onrender.com/`)

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🚀 Quick Start & Local Setup Guide

### Prerequisites
- Node.js (`v16.0` or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yesaswim06/HospitiQ.git
cd HospitiQ
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm start
```

### 4. Open in Browser
Open your browser and navigate to:  
👉 **`http://localhost:5000`** *(or http://localhost:5001)*

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## ☁️ Cloud Deployment Guide (Vercel & Render)

### 📐 Option 1: Full-Stack Deployment on Vercel (Monorepo)

1. **Push to GitHub**: `git push origin main`
2. **Connect to Vercel**: Import `yesaswim06/HospitiQ` on Vercel.
3. **Environment Variables**: Add `MONGODB_URI` and `NODE_ENV=production`.
4. **Deploy**: Vercel deploys frontend at `https://hospiti-q.vercel.app/` and API endpoints at `/api/...`.

---

### 🌐 Option 2: Backend on Render + Frontend on Vercel (Decoupled)

#### Step A: Deploy Backend API on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) > **New Web Service**.
2. Select `yesaswim06/HospitiQ`.
3. Set **Root Directory** to `backend`, **Build Command** to `npm install`, **Start Command** to `npm start`.
4. Add `PORT=5000` and `MONGODB_URI`.
5. Render deploys your API at **`https://hospitiq.onrender.com/`**.

#### Step B: Deploy Frontend UI on Vercel
1. Go to Vercel Dashboard > Import `yesaswim06/HospitiQ`.
2. Set **Root Directory** to `frontend`.
3. Vercel deploys your UI at **`https://hospiti-q.vercel.app/`**.

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

## ⭐ Support the Project

If you find this project helpful, please consider giving it a ⭐ on GitHub! Your support helps to grow the project and reach more contributors.

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 📧 Support & Contact

- **Customer Care & Support**: `support@hospitiq.org`
- **Official Live Application (Vercel)**: [https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)
- **Official Live REST API (Render)**: [https://hospitiq.onrender.com/api/queue](https://hospitiq.onrender.com/api/queue)
- **Edition**: Smart India Hackathon 2026 (SIH 2026)
