const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, getStore } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Connect Database
connectDB();
const store = getStore();

// --- 1. AUTHENTICATION API ---
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  let user = null;

  if (role === 'Patient') {
    user = store.users.find(u => u.role === 'Patient') || { id: 'usr-pt', name: 'Ramesh Verma', role: 'Patient', tokenNumber: 'A-024' };
  } else if (email) {
    user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user && role === 'Doctor') {
    user = store.users.find(u => u.role === 'Doctor') || { id: 'usr-doc-1', name: 'Dr. Sunita Rao', role: 'Doctor', department: 'Cardiology', email: 'doctor@hospitiq.org' };
  }

  if (!user) {
    user = store.users.find(u => u.role === 'Admin') || { id: 'usr-adm', name: 'Dr. Vikramaditya Roy', role: 'Admin', email: 'admin@hospitiq.org' };
  }

  res.json({
    success: true,
    message: `Authenticated as ${user.name} (${user.role})`,
    token: `token_hospitiq_${user.id}_${Date.now()}`,
    user
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, user: store.users[0] });
});

// --- 2. PUBLIC PATIENT TOKEN LOOKUP ---
app.get('/api/patient/:tokenNumber', (req, res) => {
  const rawParam = String(req.params.tokenNumber || '').trim();
  const cleanUpper = rawParam.toUpperCase();
  const cleanNoDash = cleanUpper.replace(/[\s\-]/g, '');

  const tokenItem = store.queue.find(q => {
    if (!q) return false;
    const t = (q.tokenNumber || '').toUpperCase();
    return t === cleanUpper || t.replace(/[\s\-]/g, '') === cleanNoDash || (q.patientName || '').toLowerCase() === rawParam.toLowerCase();
  });
  
  if (tokenItem) {
    res.json({ success: true, patientToken: tokenItem });
  } else {
    const formattedToken = cleanUpper.includes('-') ? cleanUpper : (cleanUpper.length > 1 ? `${cleanUpper.charAt(0)}-${cleanUpper.slice(1)}` : cleanUpper);
    res.json({
      success: true,
      patientToken: {
        id: `q-${Date.now()}`,
        tokenNumber: formattedToken,
        patientName: rawParam.length > 3 && !rawParam.match(/^[A-Za-z]\-?\d+$/) ? rawParam : 'OPD Walk-in Patient',
        age: 30,
        gender: 'Male',
        department: 'General Medicine',
        doctor: 'Dr. Sunita Rao',
        doctorId: 'doc-1',
        waitTime: 15,
        patientsAhead: 1,
        room: 'OPD Room #104',
        priority: 'Standard',
        status: 'Waiting',
        registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        smsSent: true
      }
    });
  }
});

// --- 3. OPD QUEUE & CAPACITY STATS API ---
app.get('/api/stats', (req, res) => {
  const waitingPatients = store.queue.filter(q => q.status === 'Waiting');
  const inConsult = store.queue.filter(q => q.status === 'In Consultation');
  const completed = store.queue.filter(q => q.status === 'Completed');
  const occupiedBeds = store.beds.filter(b => b.status === 'Occupied').length;
  const availBeds = store.beds.filter(b => b.status === 'Available').length;
  const icuAvail = store.beds.filter(b => b.ward === 'ICU' && b.status === 'Available').length;

  res.json({
    success: true,
    opd: {
      totalToday: store.queue.length + 14,
      waiting: waitingPatients.length,
      served: completed.length + 18,
      inConsultation: inConsult.length
    },
    beds: {
      total: store.beds.length,
      occupied: occupiedBeds,
      available: availBeds
    },
    queue: {
      totalWaiting: waitingPatients.length,
      avgWaitTimeMins: 18,
      longestWaitTimeMins: 32
    },
    emergency: {
      patients: store.queue.filter(q => q.priority === 'Emergency').length,
      icuBedsAvailable: icuAvail,
      criticalAlerts: 1
    }
  });
});

app.get('/api/capacity', (req, res) => {
  const totalBeds = store.beds.length;
  const occupiedBeds = store.beds.filter(b => b.status === 'Occupied').length;
  const icuTotal = store.beds.filter(b => b.ward === 'ICU').length;
  const icuOccupied = store.beds.filter(b => b.ward === 'ICU' && b.status === 'Occupied').length;
  const emgTotal = store.beds.filter(b => b.ward === 'Emergency').length;
  const emgOccupied = store.beds.filter(b => b.ward === 'Emergency' && b.status === 'Occupied').length;

  const bedOccPercent = Math.round((occupiedBeds / totalBeds) * 100);
  const icuOccPercent = Math.round((icuOccupied / icuTotal) * 100);
  const emgOccPercent = Math.round((emgOccupied / emgTotal) * 100);

  res.json({
    success: true,
    opdLoadPercent: 68,
    bedOccupancyPercent: bedOccPercent,
    icuOccupancyPercent: icuOccPercent,
    emergencyCapacityPercent: emgOccPercent,
    overallStatus: icuOccPercent > 85 ? 'Critical' : (bedOccPercent > 70 ? 'High Load' : 'Normal')
  });
});

// --- 4. QUEUE CRUD API ---
app.get('/api/queue', (req, res) => {
  res.json({ success: true, queue: store.queue });
});

app.post('/api/queue/token', (req, res) => {
  const { patientName, age, gender, phone, department, doctorId, priority } = req.body;
  const doc = store.doctors.find(d => d.id === doctorId) || store.doctors[0];
  const deptCode = department ? department.charAt(0).toUpperCase() : 'A';
  const tokenNum = `${deptCode}-${String(store.queue.length + 105).padStart(3, '0')}`;
  const estWaitMins = (doc.patientsWaiting + 1) * 12;

  const newToken = {
    id: `q-${Date.now()}`,
    tokenNumber: tokenNum,
    patientName: patientName || 'Walk-in OPD Patient',
    age: parseInt(age, 10) || 30,
    gender: gender || 'Male',
    phone: phone || '+91 99000 11223',
    department: department || doc.department,
    doctor: doc.name,
    doctorId: doc.id,
    waitTime: estWaitMins,
    patientsAhead: doc.patientsWaiting,
    room: doc.room,
    priority: priority || 'Normal',
    status: 'Waiting',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    smsSent: true
  };

  doc.patientsWaiting += 1;
  store.queue.unshift(newToken);

  res.json({ success: true, message: `Token ${tokenNum} generated! SMS alert sent. Estimated wait: ${estWaitMins} mins.`, token: newToken });
});

app.post('/api/queue/call-next', (req, res) => {
  const { doctorId } = req.body;
  const doc = store.doctors.find(d => d.id === doctorId || d.name === doctorId) || store.doctors[0];
  let nextInLine = store.queue.find(q => (q.doctor === doc.name || q.doctorId === doc.id) && q.status === 'Waiting');

  if (!nextInLine) {
    nextInLine = store.queue.find(q => q.status === 'Waiting');
    if (nextInLine) {
      nextInLine.doctor = doc.name;
      nextInLine.doctorId = doc.id;
      nextInLine.room = doc.room;
    }
  }

  if (nextInLine) {
    nextInLine.status = 'In Consultation';
    doc.currentPatient = `${nextInLine.tokenNumber} (${nextInLine.patientName})`;
    doc.patientsWaiting = Math.max(0, doc.patientsWaiting - 1);
    doc.status = 'Busy';
    res.json({ success: true, message: `Calling Token ${nextInLine.tokenNumber} (${nextInLine.patientName}) to ${doc.room}`, calledToken: nextInLine });
  } else {
    res.json({ success: false, message: `No waiting patients in queue for ${doc.name}` });
  }
});

app.put('/api/queue/:id/status', (req, res) => {
  const { status } = req.body;
  const tokenItem = store.queue.find(q => q.id === req.params.id || q.tokenNumber === req.params.id);
  if (tokenItem) {
    tokenItem.status = status;
    if (status === 'Completed') {
      const doc = store.doctors.find(d => d.name === tokenItem.doctor || d.id === tokenItem.doctorId);
      if (doc) {
        doc.status = 'Available';
        doc.currentPatient = 'None';
      }
    }
    res.json({ success: true, message: `Token ${tokenItem.tokenNumber} status updated to ${status}`, token: tokenItem });
  } else {
    res.status(404).json({ success: false, message: 'Token item not found' });
  }
});

// --- 5. ADMISSIONS API ---
app.get('/api/admissions', (req, res) => {
  res.json({ success: true, admissions: store.admissions });
});

// --- 6. DOCTOR PROFILE STATUS UPDATE API ---
app.put('/api/doctors/:id/status', (req, res) => {
  const { status } = req.body;
  const doc = store.doctors.find(d => d.id === req.params.id || d.name === req.params.id);
  if (doc) {
    doc.status = status;
    res.json({ success: true, message: `Doctor status updated to ${status}`, doctor: doc });
  } else {
    res.status(404).json({ success: false, message: 'Doctor not found' });
  }
});

// --- 7. ADMIN CREATE DOCTOR LOGIN API ---
app.get('/api/doctors', (req, res) => res.json({ success: true, doctors: store.doctors }));

app.post('/api/doctors', (req, res) => {
  const { name, specialization, department, room, phone, email, password } = req.body;
  const formattedName = name.startsWith('Dr.') ? name : `Dr. ${name}`;
  const newDocId = `doc-${Date.now()}`;
  const docEmail = email || `${name.toLowerCase().replace(/[^a-z]/g, '')}@hospitiq.org`;

  const newDoc = {
    id: newDocId,
    name: formattedName,
    specialization: specialization || 'General Medicine',
    department: department || 'General Medicine',
    room: room || 'OPD Room #112',
    phone: phone || '+91 98765 00000',
    email: docEmail,
    status: 'Available',
    patientsWaiting: 0,
    currentPatient: 'None'
  };

  store.doctors.push(newDoc);
  store.users.push({
    id: `usr-${newDocId}`,
    name: formattedName,
    role: 'Doctor',
    email: docEmail,
    department: newDoc.department
  });

  res.json({
    success: true,
    message: `Doctor ${formattedName} successfully registered!`,
    doctor: newDoc
  });
});

app.delete('/api/doctors/:id', (req, res) => {
  const docIndex = store.doctors.findIndex(d => d.id === req.params.id);
  if (docIndex !== -1) {
    const deleted = store.doctors.splice(docIndex, 1);
    res.json({ success: true, message: `Removed ${deleted[0].name} from doctor roster` });
  } else {
    res.status(404).json({ success: false, message: 'Doctor not found' });
  }
});

// --- 8. BED MANAGEMENT & ADMISSIONS API ---
app.get('/api/beds', (req, res) => res.json({ success: true, beds: store.beds }));

app.put('/api/beds/:id/admit', (req, res) => {
  const { patientName, doctor, diagnosis } = req.body;
  const bed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id);

  if (bed) {
    bed.status = 'Occupied';
    bed.patient = patientName || 'Admitted Inpatient';
    bed.doctor = doctor || 'Dr. Sunita Rao';
    bed.admissionDate = new Date().toISOString().split('T')[0];

    store.admissions.unshift({
      id: `adm-${Date.now()}`,
      patient: bed.patient,
      ward: bed.ward,
      bedNumber: bed.bedNumber,
      doctor: bed.doctor,
      diagnosis: diagnosis || 'Clinical Inpatient Observation',
      admissionDate: bed.admissionDate,
      status: 'Admitted'
    });

    res.json({ success: true, message: `Patient admitted to ${bed.bedNumber} (${bed.ward})`, bed });
  } else {
    res.status(404).json({ success: false, message: 'Bed not found' });
  }
});

app.put('/api/beds/:id/discharge', (req, res) => {
  const bed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id);
  if (bed) {
    const patientName = bed.patient;
    bed.status = 'Available';
    bed.patient = null;
    bed.doctor = null;
    bed.admissionDate = null;

    res.json({ success: true, message: `Discharge complete for ${patientName || 'Patient'}. Bed ${bed.bedNumber} marked Available.`, bed });
  } else {
    res.status(404).json({ success: false, message: 'Bed not found' });
  }
});

// --- 9. EMERGENCY SIREN API ---
app.post('/api/emergency/siren', (req, res) => {
  const emergItem = {
    id: `q-emg-${Date.now()}`,
    tokenNumber: `EM-${Math.floor(500 + Math.random() * 500)}`,
    patientName: 'CRITICAL TRAUMA PATIENT',
    age: 45,
    gender: 'Male',
    department: 'Emergency',
    doctor: 'Dr. Vikram Malhotra',
    doctorId: 'doc-2',
    waitTime: 0,
    patientsAhead: 0,
    room: 'ER Resuscitation Bay #01',
    priority: 'Emergency',
    status: 'In Consultation',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    smsSent: true
  };

  store.queue.unshift(emergItem);

  res.json({
    success: true,
    message: '🚨 HOSPITAL-WIDE EMERGENCY SIREN BROADCASTED TO ALL OPD & ER TERMINALS',
    dispatchedToken: emergItem
  });
});

// --- 10. DEPARTMENTS, PATIENTS, INSIGHTS API ---
app.get('/api/departments', (req, res) => res.json({ success: true, departments: store.departments }));
app.get('/api/patients', (req, res) => res.json({ success: true, patients: store.queue }));
app.get('/api/insights', (req, res) => res.json({ success: true, insights: store.insights, alerts: store.alerts }));

// Public Static & Fallback
app.get('/token/:tokenNumber', (req, res) => {
  const mainPath = path.join(__dirname, '../public/index.html');
  res.sendFile(mainPath);
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const fs = require('fs');
    const frontPath = path.join(__dirname, '../frontend/public/index.html');
    const rootPath = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(frontPath)) {
      res.sendFile(frontPath);
    } else if (fs.existsSync(rootPath)) {
      res.sendFile(rootPath);
    } else {
      res.send('HOSPITIQ API Server Running');
    }
  }
});

const startServer = (portToTry) => {
  const currentPort = parseInt(portToTry, 10);
  const server = app.listen(currentPort, () => {
    console.log(`
  🏥 =======================================================
  🏥 HOSPITIQ Server running on: http://localhost:${currentPort}
  🏥 Smart Hospital OPD Queue & Bed Availability Platform
  🏥 SIH 2026 Interactive Demonstration Mode Active
  🏥 =======================================================
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${currentPort} is currently in use. Trying port ${currentPort + 1}...`);
      startServer(currentPort + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

module.exports = app;

if (!process.env.VERCEL && require.main === module) {
  startServer(PORT);
}
