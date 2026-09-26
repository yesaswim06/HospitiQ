# HOSPITIQ — Next-Gen Smart Hospital OPD & Inpatient Operations Orchestration
MTX B2B Healthcare Innovation Project | Enterprise Release v2.4

---

# Executive Summary & Vision
### Transforming Hospital Waiting into Seamless, Intelligent Care
- **The Core Mission**: An enterprise-grade, synchronized 3-tier hospital management platform connecting Patients, Doctors, and Administrators.
- **Key Breakthrough**: Replaces chaotic first-come queues with **AI Clinical Triage (P1-P5)** and **Automated Specialist Routing**.
- **Impact Metrics**: 
  - ⏱️ **60% reduction** in patient waiting anxiety & congestion
  - 🚨 **0 min delay** for acute life-threatening emergencies (P1/P2)
  - 🏥 **100-bed live visibility** across ICU, Emergency, and Specialty Wards

---

# The Problem: Hospital Operational Bottlenecks
### Critical Friction Points in Modern Healthcare Facilities
- **OPD Queue Chaos**: 45–90 minute blind wait times with crowded waiting bays and zero queue telemetry.
- **Delayed Emergency Identification**: Critical presentations (heart attacks, stroke) sit unrecognized in standard OPD lines.
- **Bed Allocation Blind Spots**: Manual phone coordination between OPD doctors and ward nurses delays urgent admissions.
- **Alarming Reality**: 73% of patient dissatisfaction stems from unpredictable waiting periods, with zero digital audit trails in paper registers.

---

# The Solution: The HOSPITIQ Ecosystem
### Integrated Multi-Portal Patient Flow Architecture
- 🧑‍⚕️ **Patient OPD Portal (`patient.html`)**: Live queue countdown, dynamic room assignment, and contactless QR passes.
- 🩺 **Doctor Consultation Terminal (`doctor.html`)**: Active consultation desk, AI triage review & overrides, and direct ward bed reservation.
- 🏢 **Admin Command Center (`admin.html`)**: Real-time hospital KPIs, 100-bed ward matrix, roster management, and 1-click Emergency Siren.
- 🔒 **Enterprise Compliance**: Automated 15-day OP data lifecycle purge adhering to healthcare data minimization regulations.

---

# System Architecture & Technical Stack
### High-Performance, Scalable Full-Stack Engineering
- **Frontend Layer**: HTML5, Modern CSS3 Glassmorphism (`border-radius: 28px`), Vanilla ES6+ JS with zero client framework overhead.
- **Backend & APIs**: Node.js & Express.js high-throughput REST API with cryptographic session security.
- **Database & Persistence**: MongoDB Atlas & Mongoose with schema validation for Patients, Tokens, Doctors, and 100 Beds.
- **Visuals & Cloud**: Chart.js queue telemetry, QRCode.js vector rendering, Vercel CDN hosting & Railway cloud backend.

---

# Patient OPD Portal & Live Mobile Pass
### Zero-Friction Patient Experience from Entry to Doctor Room
- **Passwordless Fast Access**: Instant retrieval via 10-digit phone number or Token ID.
- **Live Queue Telemetry**: Real-time countdown timer showing remaining minutes, patients ahead, and assigned room.
- **Specialist & Room Visibility**: Live consultation status badges (`WAITING`, `IN CONSULTATION`, `COMPLETED`).
- **Contactless QR Pass**: Scannable vector QR code for instant patient identification at consultation doors.

---

# AI Clinical Triage & Specialist Routing
### 5-Level Manchester / ESI Protocol with VAS Pain Scoring
- 🔴 **P1 Immediate (Red)**: Airway collapse, cardiac arrest → Instant ER Bay #01 (0 min wait)
- 🟠 **P2 Emergency (Orange)**: Acute chest pain, stroke, trauma → Fast-track ER Bay #02 (<5 min wait)
- 🟡 **P3 Urgent (Yellow)**: High fever, fractures, severe pain (VAS 7-8) → Urgent OPD slot (<15 min wait)
- 🔵 **P4 / 🟢 P5 Less/Non-Urgent**: Routine illness, prescription refills → Standard specialist queue
- **Automated Specialist Matching**:
  - *Chest Pain* ➔ **Cardiology** (Dr. Sunita Rao, Room #104) | *Numbness / Stroke* ➔ **Neurology** (Dr. Priya Patel, Room #304)
  - *Fractures / Trauma* ➔ **Orthopedics** (Dr. Ananya Reddy, Room #201) | *Child Illness* ➔ **Pediatrics** (Dr. Hrishikesh Deshmukh, Room #105)

---

# Doctor Consultation Terminal
### Streamlined Physician Workflow & Clinical Decision Support
- **Secure Physician Gate**: Dedicated PIN/Password authentication with show/hide eye toggle.
- **Active Consultation Desk**: Displays seated patient vitals, symptom history, and VAS pain severity index.
- **AI Triage Validation & Override**: Doctors inspect AI reasoning with full authority to confirm or override priority levels.
- **Direct Inpatient Bed Reservation**: In-terminal modal to check ward readiness and reserve inpatient beds without leaving the desk.

---

# Hospital Admin Command Center & 100-Bed Matrix
### Comprehensive Real-Time Hospital Operations & Critical Control
- **Real-Time KPI Dashboard**: Live patient registration counts, waiting queue, treated patients, and average consultation speed.
- **Interactive 100-Bed Grid**: Real-time status matrix across ICU, Emergency, General, Private, Semi-Private, Pediatric, and Maternity.
- **Smart Bed Recommender**: Automatic matching algorithms for clinical ward, ventilator readiness, and oxygen support requirements.
- **Emergency Siren System**: 1-click critical alert broadcasting across all hospital screens for instant code response.

---

# Security Architecture & UI/UX Design System
### Enterprise Protection & Ergonomic Visual Aesthetics
- **HMAC-SHA256 Token Security**: Digital cryptographic signature preventing client-side role or token tampering.
- **Role-Based Access Control (RBAC)**: Strict client/server boundary protection for Doctor and Admin portals.
- **Curved Glassmorphism (`border-radius: 28px`)**: Frosted glass surfaces, neon accents, and zero-clipping adaptive dialogs.
- **High-Contrast Dual Themes**: Seamless light and dark mode adhering to WCAG accessibility guidelines.

---

# Engineering Team, Impact & Future Roadmap
### Team Contributions & Future Evolution
- **Core Engineering Team**:
  - 👩‍💼 **Manjula B** (Team Leader / Healthcare Lead) • 💻 **Tarun Kumar N** (Backend & API Architect)
  - 🎨 **Charan Teja M** (Frontend & UI/UX Specialist) • 🗄️ **M N Yesaswi Bhargav** (Database Architect)
  - ☁️ **Manvitha N** (DevOps & Cloud Infrastructure)
- **Business Impact**: Eliminates OPD chaos, cuts emergency response latency to 0, and optimizes 100-bed occupancy.
- **Future Roadmap**: Bluetooth IoT vital monitors integration, multilingual voice triage, and direct hospital pharmacy e-prescriptions.
