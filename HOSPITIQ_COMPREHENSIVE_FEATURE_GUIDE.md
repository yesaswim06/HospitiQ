# HOSPITIQ — Comprehensive Feature Guide & System Documentation
**Project**: MTX B2B Healthcare Innovation Project  
**Platform**: Next-Generation Smart Hospital OPD Triage & Inpatient Operations Orchestration  
**Release Version**: v2.4 (Production Ready)  
**Date**: September 2026  

---

## 📖 1. Introduction & Executive Summary

### What is HOSPITIQ?
In everyday terms, **HOSPITIQ** is a smart digital brain for hospitals. 

Traditionally, when someone walks into a hospital outpatient department (OPD), they take a paper slip, stand in long queues, and wait for hours without knowing when their turn will come. Worse, critical patients—such as someone suffering an early heart attack or acute stroke—are often forced to sit in the same slow-moving line as someone who just needs a routine prescription refill.

**HOSPITIQ solves this completely.** It is a real-time, synchronized healthcare platform that connects three critical hospital stakeholders:
1. **The Patient**: Who gets instant registration, an automated symptom assessment, and a live digital QR token pass on their mobile phone with real-time wait telemetry.
2. **The Doctor**: Who gets a streamlined consultation desk showing patient vitals, AI clinical recommendations, queue controls, and instant ward bed reservation.
3. **The Hospital Administrator**: Who gets a 360-degree command center with live queue analytics, a 100-bed interactive ward grid, emergency siren triggers, and doctor roster management.

---

## 🏥 2. The Core Problem HOSPITIQ Solves

Before HOSPITIQ, hospitals faced four massive operational bottlenecks:

1. **OPD Waiting Chaos & Patient Anxiety**: Patients routinely waited 45 to 90 minutes in crowded waiting bays with zero transparency about queue progress.
2. **Delayed Emergency Triage**: In a standard first-come-first-served line, medical receptionists cannot accurately assess subtle, life-threatening symptoms, putting critical patients at grave risk.
3. **Bed Allocation Blind Spots**: When an OPD patient urgently needs hospital admission, doctors and nurses traditionally make multiple phone calls to various wards to ask if beds, ventilators, or oxygen cylinders are available.
4. **Data Privacy & Queue Bloat**: Paper registers and static databases store outdated outpatient data indefinitely without proper lifecycle compliance.

---

## 🌟 3. Detailed Breakdown of Every Key Feature

---

### 🔹 Key Feature 1: AI Clinical Triage & VAS Pain Scoring Engine
* **How It Works**: When a patient registers their symptoms, HOSPITIQ’s built-in clinical triage algorithm instantly evaluates the urgency of their condition using the international **Manchester / Emergency Severity Index (ESI)** protocol combined with the **Visual Analog Scale (VAS 1–10)** pain scoring system.
* **The 5-Tier Priority Classification**:
  - 🔴 **Priority 1 (P1) — Immediate (Red)**: Airway collapse, cardiac arrest, unresponsiveness. Immediate fast-tracking to **ER Bay #01** (0-minute wait).
  - 🟠 **Priority 2 (P2) — Emergency (Orange)**: Severe chest pain, stroke symptoms, acute major bleeding. Fast-tracked to **ER Bay #02** (< 5 minutes).
  - 🟡 **Priority 3 (P3) — Urgent (Yellow)**: High fever with chills, suspected fractures, severe pain (VAS 7–8). Assigned urgent specialist slot (< 15 minutes).
  - 🔵 **Priority 4 (P4) — Less Urgent (Blue)**: Routine illness, mild stomach ache, sore throat, minor rashes. Standard OPD queue.
  - 🟢 **Priority 5 (P5) — Non-Urgent (Green)**: Routine checkup, prescription refills, medical certificate renewals.
* **Why It Matters**: It removes guesswork and human error at the reception desk, ensuring life-threatening emergencies are treated immediately.

---

### 🔹 Key Feature 2: Automated Symptom-to-Specialist Routing
* **How It Works**: Instead of requiring non-medical patients to guess which doctor or department they need, the system maps 8 primary clinical categories directly to matching specialist doctors and room numbers:
  1. **Cardiac & Chest Discomfort** ➔ **Cardiology** (*Dr. Sunita Rao*, Room #104)
  2. **Neurological, Stroke & Head Injury** ➔ **Neurology** (*Dr. Priya Patel*, Room #304)
  3. **Orthopedic, Joint & Fractures** ➔ **Orthopedics** (*Dr. Ananya Reddy*, Room #201)
  4. **Pediatric & Childhood Illness** ➔ **Pediatrics** (*Dr. Hrishikesh Deshmukh*, Room #105)
  5. **Dermatology & Skin Disorders** ➔ **Dermatology** (*Dr. Suresh Menon*, Room #110)
  6. **ENT & Sinus Infections** ➔ **ENT Specialist** (*Dr. Meera Nambiar*, Room #115)
  7. **Trauma, Burns & Bleeding** ➔ **Emergency / Trauma Care** (ER Bay #01/#02)
  8. **General & Routine Checkup** ➔ **General Medicine** (*Dr. Vikram Malhotra*, Room #108)
* **Why It Matters**: Patients are routed directly to the correct specialist from second one, cutting down redundant re-consultations and misplaced department visits.

---

### 🔹 Key Feature 3: Patient OPD Portal & Live Contactless QR Pass (`patient.html`)
* **How It Works**: 
  - **Passwordless Fast Lookup**: Patients simply enter their 10-digit mobile number or Token ID (e.g. `OPD-101`) to access their personal dashboard.
  - **Live Queue Telemetry**: The screen displays a dynamic countdown timer, the exact number of patients ahead, the assigned doctor name, and room number.
  - **Color-Coded Status Badges**: The token badge automatically transitions from `WAITING` (orange) $\rightarrow$ `IN CONSULTATION` (blue pulse) $\rightarrow$ `COMPLETED` (green checkmark).
  - **Scannable QR Pass**: Generates a high-contrast vector QR code that staff can scan at consultation doors or hospital kiosks.
* **Why It Matters**: Patients can comfortably wait in a cafeteria or garden while tracking their exact live queue position on their phone, completely eliminating waiting bay crowding.

---

### 🔹 Key Feature 4: Doctor Consultation Terminal (`doctor.html`)
* **How It Works**:
  - **Dedicated Physician Authentication Gate**: Secure login with password eye toggle (`Show/Hide`) and quick-select department roster presets.
  - **Active Consultation Desk**: Displays the currently seated patient's age, gender, contact, clinical history, and VAS pain severity.
  - **One-Click "Call Next Patient"**: Automatically summons the highest-priority waiting patient into the consultation chamber.
  - **AI Triage Review & Clinical Override**: Doctors can inspect the AI reasoning behind the triage score and have full authority to confirm or override the priority level.
  - **Direct Inpatient Bed Recommendation & Reservation**: If a patient requires admission, the doctor can open the bed allocation modal directly from the consultation screen without leaving their desk.
* **Why It Matters**: Doctors save 5 to 7 minutes per consultation by having all patient telemetry, queue actions, and admission tools consolidated into one single screen.

---

### 🔹 Key Feature 5: Hospital Admin Command Center (`admin.html`)
* **How It Works**:
  - **Real-Time Operations KPIs**: Live tracking of total OPD registrations, current waiting count, treated patients, and average consultation speed.
  - **Doctor Roster & Room Manager**: Administrators can toggle doctor availability (`AVAILABLE`, `CONSULTING`, `ON_LEAVE`), edit OPD room numbers, and manage physician profiles.
  - **Patient Directory & Audit Log**: Comprehensive search, filter, and export capabilities for all hospital admissions and outpatient tokens.
  - **One-Click Hospital Emergency Siren**: In case of a major trauma event or fire alert, a single click activates a synchronized visual red siren alert across every terminal in the hospital.
* **Why It Matters**: Hospital leadership and operations managers have total real-time control over hospital capacity, physician workload, and safety protocols.

---

### 🔹 Key Feature 6: Interactive 100-Bed Ward Matrix & Life-Support Recommender
* **How It Works**:
  - **100 Real Beds Filterable Grid**: Covers 7 dedicated clinical wards: **ICU**, **Emergency**, **General Ward**, **Private Ward**, **Semi-Private**, **Pediatric**, and **Maternity**.
  - **Live Bed Status Badges**: Visual indicators for `AVAILABLE` (green), `OCCUPIED` (red), and `CLEANING / MAINTENANCE` (yellow).
  - **Intelligent Bed Recommendation Engine**: Administrators and doctors can select patient requirements (e.g. *Needs Ventilator*, *Needs Oxygen Support*, *Ward Preference*), and the algorithm automatically computes the top compatible, sanitized beds ready for immediate admission.
* **Why It Matters**: Eliminates manual room searches and phone delays, ensuring critical patients transition from OPD to ICU in minutes.

---

### 🔹 Key Feature 7: Enterprise Security, Password Gates & 15-Day Data Lifecycle
* **How It Works**:
  - **Interactive Password Show/Hide Toggle**: All password input fields feature an eye-toggle button allowing users to verify their passkey while preventing shoulder-surfing.
  - **HMAC-SHA256 Token Signing**: All session and token communications use cryptographic signatures to prevent client-side data tampering.
  - **Role-Based Access Control (RBAC)**: Patients cannot access doctor or admin endpoints, and doctors are restricted to clinical workflows.
  - **Automated 15-Day Data Lifecycle Purge**: Outpatient OPD records automatically expire and purge after 15 days in strict compliance with medical data minimization and privacy standards.
* **Why It Matters**: Protects sensitive patient health information (PHI) while maintaining database speed and regulatory compliance.

---

### 🔹 Key Feature 8: Modern UI/UX Design System (Glassmorphism & Dual Themes)
* **How It Works**:
  - **Curved Glassmorphism Aesthetics**: Built with smooth rounded contours (`border-radius: 26px - 28px`), frosted-glass backdrop blur, and neon accent borders.
  - **Zero-Clipping Adaptive Modals**: Modal dialogs automatically adjust their height and include internal vertical scrolling so action buttons are never cut off on any screen size.
  - **High-Contrast Dual Themes**: One-click switching between **Dark Navy Mode** (for low-strain night shifts) and **Light Mode** (for bright clinical rooms), both adhering to WCAG contrast standards.
  - **Mobile-First Touch Optimization**: Collapsible sidebar drawer and touch-friendly controls designed for one-handed phone usage.
* **Why It Matters**: Reduces visual fatigue for doctors during long shifts and provides an intuitive, friction-free interface for patients of all ages.

---

## 🏗️ 4. Technical Architecture & Technology Stack

| Layer | Technology Used | Architecture Role & Rationale |
|---|---|---|
| **Frontend UI** | HTML5, Modern CSS3 (Glassmorphism), Vanilla ES6+ JS | Zero heavy JavaScript framework bloat; sub-second rendering speed on mobile and desktop browsers. |
| **Backend API** | Node.js, Express.js | High-throughput REST API with cryptographic token hashing, rate-limiting, and modular routing. |
| **Database** | MongoDB Atlas & Mongoose | Flexible NoSQL schemas with indexing for Patients, Tokens, Doctors, Admissions, and 100 Beds. |
| **Visuals & QR** | Chart.js, QRCode.js, Lucide Icons | Real-time analytics telemetry charts, vector QR pass generation, and medical iconography. |
| **Cloud Hosting** | Vercel (Frontend CDN), Railway / Cloud (Backend API) | Automated CI/CD deployment pipeline with continuous uptime monitoring and SSL encryption. |

---

## 👥 5. Core Engineering Team & Responsibilities

1. **MANJULA B** — *Team Leader & Healthcare Domain Lead*
   - Oversees project vision, clinical workflow research, stakeholder coordination, and healthcare compliance.
2. **TARUN KUMAR N** — *Backend Developer & API Architect*
   - Architected the Node/Express REST API, AI clinical triage calculation engine, cryptographic HMAC security, and WebSocket telemetry.
3. **CHARAN TEJA M** — *Frontend Developer & UI/UX Specialist*
   - Designed the curved glassmorphism design system, role authentication gates, responsive mobile drawer, and dynamic modal layouts.
4. **M N YESASWI BHARGAV** — *Database Architect & Schema Design*
   - Modeled MongoDB schemas, structured query indexing, and engineered the automated 15-day OP data lifecycle management.
5. **MANVITHA N** — *DevOps & Cloud Infrastructure Engineer*
   - Configured CI/CD automated deployment pipelines, Vercel/Railway cloud hosting orchestration, and uptime telemetry.

---

## 🏁 6. Conclusion

**HOSPITIQ** bridges the gap between chaotic hospital queues and life-saving medical care. By uniting AI-driven clinical triage, instant specialist routing, live mobile telemetry, and 100-bed inpatient operations into one unified ecosystem, HOSPITIQ transforms hospitals into smart, transparent, and patient-first healthcare environments.
