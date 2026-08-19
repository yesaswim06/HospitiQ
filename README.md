# 🏥 HOSPITIQ — Smart OPD Queue & Hospital Bed Management System

<p align="center">
  <img src="public/images/hospitiq_tab_favicon.jpg" alt="HOSPITIQ Logo" width="240" style="border-radius: 36px; box-shadow: 0 10px 30px rgba(14, 165, 233, 0.4);" />
</p>

<p align="center">
  <strong>SIH 2026 Innovation Project | Smart India Hackathon 2026</strong><br>
  <em>"Smarter Queues. Better Care." — Eliminating OPD Wait Times & Automating Hospital Operations Across India</em>
</p>

<p align="center">
  <a href="https://hospiti-q.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-hospiti--q.vercel.app-brightgreen.svg?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
</p>

<p align="center">
  <a href="https://github.com/yesaswim06/HospitiQ"><img src="https://img.shields.io/badge/SIH-2026-blue.svg" alt="SIH 2026" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v18.0+-green.svg" alt="Node.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-v4.19-lightgrey.svg" alt="Express" /></a>
  <a href="https://mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg" alt="MongoDB" /></a>
  <a href="https://hospiti-q.vercel.app/"><img src="https://img.shields.io/badge/Deployment-Vercel-orange.svg" alt="Deployment" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="License" /></a>
</p>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />

## 🌐 Live Web Application & Demonstration
👉 **Official Live URL**: **[https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)**

---

## 📌 Executive Summary & Problem Statement

In traditional healthcare systems across India, patients spend up to **3.5 hours** waiting in crowded Outpatient Department (OPD) queues, while hospital staff lack real-time visibility into bed occupancy, doctor consultation dispatching, and emergency admissions.

**HOSPITIQ (Med-Space)** resolves this healthcare crisis by implementing a real-time digital OPD token pass system, automated doctor room dispatching, smart bed matrix allocation, and contactless patient QR check-ins.

---

## 🌟 Key Features & Platform Highlights

### 🎟️ 1. Smart Contactless OPD Token Pass
- **Instant Token Generation**: Patients or receptionists generate sequential OPD token passes (`A-031`, `B-014`).
- **Live Wait Time Forecasting**: AI algorithms dynamically compute wait times based on historical doctor consultation speeds.
- **Contactless QR Pass**: Generates digital QR code passes printable or viewable on smartphones.

### 🩺 2. Doctor Consultation Terminal
- **Priority Triage Dispatch**: Categorizes patient queues by emergency level (*Emergency*, *High Priority*, *Standard*).
- **Vitals Monitoring Chips**: Displays real-time patient vitals (*Pulse*, *BP*, *Temp*).
- **1-Click Patient Calling**: Directs patients to assigned OPD consultation rooms (`OPD Room #104 — Cardiology`).

### 🛏️ 3. Hospital 100-Bed Matrix & Ward Layout
- **Real-Time Ward Monitoring**: Live tracking of ICU, Emergency, General, and Private wards.
- **Interactive Bed Map**: Visual grid status (*Occupied*, *Vacant*, *Under Cleaning*).
- **AI Bed Recommendation Engine**: Recommends optimal bed placement based on diagnosis and urgency.

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
├── backend/                  # Express.js REST API Server & Database
│   ├── server.js             # REST API endpoints & route dispatchers
│   └── db.js                 # MongoDB Atlas integration & dataset fallback
├── frontend/                 # Client Web Application
│   └── public/
│       ├── index.html        # Single-page multi-view markup
│       ├── css/
│       │   └── styles.css    # Healthcare Glassmorphic Design System
│       ├── js/
│       │   ├── api.js        # REST API fetch client
│       │   └── app.js        # Dynamic UI state engine & router
│       └── images/           # Asset images & social icons
├── HOSPITIQ_Wall_QR_Poster.jpg # Printable Hospital Wall QR Poster Asset
├── README.md                 # Documentation
├── package.json              # Dependencies & startup scripts
├── server.js                 # Application launcher
└── vercel.json               # Vercel cloud deployment manifest
```

---

## 🛠️ Tech Stack & Technologies Used

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Glassmorphism & CSS Variables), Lucide Vector Icons
- **Backend**: Node.js, Express.js REST Framework
- **Database**: MongoDB Atlas (with high-performance in-memory dataset fallback)
- **Live Deployment**: Vercel (`https://hospiti-q.vercel.app/`)

---

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

## 👥 SIH 2026 Innovation Team

| Name | Role |
| :--- | :--- |
| **M N YESASWI BHARGAV (TL)** | Team Lead |
| **RAMCHARAN G** | Frontend Developer |
| **MANJULA B** | UI/UX Designer |
| **MANVITHA N** | Graphic Designer |
| **SUPRIYA A** | Healthcare Researcher |
| **CHARAN TEJA M** | Technology Researcher |

---

## 📧 Support & Contact

- **Customer Care & Support**: `myselfadmin123@gmail.com`
- **Official Live Application**: [https://hospiti-q.vercel.app/](https://hospiti-q.vercel.app/)
- **Edition**: Smart India Hackathon 2026 (SIH 2026)
- **License**: MIT License
