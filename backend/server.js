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
    user = { id: 'usr-pt', name: 'Ramesh Verma', role: 'Patient', tokenNumber: 'A-031' };
  } else if (email) {
    user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user && role === 'Doctor') {
    user = store.users.find(u => u.role === 'Doctor') || { id: 'usr-doc-1', name: 'Dr. Sunita Rao', role: 'Doctor', department: 'Cardiology', email: 'doctor@hospitiq.org' };
  }

  if (!user) {
    user = store.users.find(u => u.role === 'Admin') || { id: 'usr-adm', name: 'Dr. Rajesh Sharma', role: 'Admin', email: 'admin@hospitiq.org' };
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
  const tokenNum = req.params.tokenNumber.toUpperCase();
  const tokenItem = store.queue.find(q => q.tokenNumber.toUpperCase() === tokenNum) || {
    id: 'q-demo',
    tokenNumber: tokenNum,
    patientName: 'Ramesh Verma',
    age: 44,
    gender: 'Male',
    department: 'Cardiology',
    doctor: 'Dr. Sunita Rao',
    doctorId: 'doc-1',
    waitTime: 28,
    patientsAhead: 3,
    room: 'OPD Room #104',
    priority: 'Standard',
    status: 'Waiting',
    registrationTime: '10:15 AM',
    smsSent: true,
    whatsappSent: true
  };

  res.json({ success: true, patientToken: tokenItem });
});

// --- 3. DASHBOARD & HOSPITAL CAPACITY API ---
app.get('/api/stats', (req, res) => {
  const totalOpdToday = store.queue.length + 138;
  const currentlyWaiting = store.queue.filter(q => q.status === 'Waiting').length + 18;
  const patientsServed = store.queue.filter(q => q.status === 'Completed').length + 120;

  const totalBeds = store.beds.length;
  const occupiedBeds = store.beds.filter(b => b.status === 'Occupied').length;
  const availableBeds = store.beds.filter(b => b.status === 'Available').length;
  const icuAvailable = store.beds.filter(b => b.ward === 'ICU' && b.status === 'Available').length;

  res.json({
    success: true,
    opd: { totalToday: totalOpdToday, waiting: currentlyWaiting, served: patientsServed },
    queue: { totalWaiting: currentlyWaiting, avgWaitTimeMins: 22, longestWaitTimeMins: 48 },
    beds: { total: totalBeds, occupied: occupiedBeds, available: availableBeds, occupancyRatePercent: Math.round((occupiedBeds / totalBeds) * 100) },
    emergency: { patients: 8, icuBedsAvailable: icuAvailable, criticalAlerts: store.alerts.filter(a => !a.resolved && a.type === 'critical').length }
  });
});

app.get('/api/capacity', (req, res) => {
  const totalBeds = store.beds.length;
  const occupiedBeds = store.beds.filter(b => b.status === 'Occupied').length;
  const icuTotal = store.beds.filter(b => b.ward === 'ICU').length;
  const icuOccupied = store.beds.filter(b => b.ward === 'ICU' && b.status === 'Occupied').length;

  const opdLoadPercent = 78;
  const bedOccupancyPercent = Math.round((occupiedBeds / totalBeds) * 100);
  const icuOccupancyPercent = Math.round((icuOccupied / icuTotal) * 100);
  const emergencyCapacityPercent = 65;

  let overallStatus = 'Normal';
  if (bedOccupancyPercent > 80 || icuOccupancyPercent > 85) overallStatus = 'High Load';
  if (icuOccupancyPercent >= 90) overallStatus = 'Critical';

  res.json({
    success: true,
    opdLoadPercent,
    bedOccupancyPercent,
    icuOccupancyPercent,
    emergencyCapacityPercent,
    overallStatus
  });
});

// --- 4. OPD QUEUE API & DOCTOR DISPATCH ---
app.get('/api/queue', (req, res) => {
  res.json({ success: true, queue: store.queue });
});

app.post('/api/queue', (req, res) => {
  const { patientName, age, gender, phone, department, doctorId, priority } = req.body;
  const doc = store.doctors.find(d => d.id === doctorId || d.name === doctorId) || store.doctors[0];
  const prefix = department ? department.substring(0, 1).toUpperCase() : 'A';
  const tokenNum = `${prefix}-${String(store.queue.length + 101).padStart(3, '0')}`;

  const aheadCount = doc.patientsWaiting;
  const estWaitMins = Math.round((aheadCount + 1) * 12);

  const newToken = {
    id: `q-${Date.now()}`,
    tokenNumber: tokenNum,
    patientName: patientName || 'Walk-in Patient',
    age: age || 30,
    gender: gender || 'Male',
    phone: phone || '+91 99000 11223',
    department: department || doc.department,
    doctor: doc.name,
    doctorId: doc.id,
    waitTime: estWaitMins,
    patientsAhead: aheadCount,
    room: doc.room || 'OPD Room #104',
    priority: priority || 'Normal',
    status: 'Waiting',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    smsSent: true,
    whatsappSent: true
  };

  doc.patientsWaiting += 1;
  store.queue.unshift(newToken);

  res.json({ success: true, message: `Token ${tokenNum} generated! SMS & WhatsApp alerts sent. Estimated wait: ${estWaitMins} mins.`, token: newToken });
});

app.post('/api/queue/call-next', (req, res) => {
  const { doctorId } = req.body;
  const doc = store.doctors.find(d => d.id === doctorId) || store.doctors[0];
  const nextInLine = store.queue.find(q => (q.doctor === doc.name || q.doctorId === doc.id) && q.status === 'Waiting');

  if (nextInLine) {
    nextInLine.status = 'In Consultation';
    doc.currentPatient = `${nextInLine.tokenNumber} (${nextInLine.patientName})`;
    doc.patientsWaiting = Math.max(0, doc.patientsWaiting - 1);
    doc.status = 'Busy';
    res.json({ success: true, message: `Calling Token ${nextInLine.tokenNumber} for ${doc.name}`, calledToken: nextInLine });
  } else {
    res.json({ success: false, message: `No waiting patients for ${doc.name}` });
  }
});

app.put('/api/queue/:id/status', (req, res) => {
  const { status } = req.body;
  const tokenItem = store.queue.find(q => q.id === req.params.id || q.tokenNumber === req.params.id);
  if (tokenItem) {
    tokenItem.status = status;
    res.json({ success: true, token: tokenItem });
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
    specialization: specialization || 'General Practice',
    department: department || 'General Medicine',
    status: 'Available',
    patientsWaiting: 0,
    currentPatient: 'None',
    room: room || 'OPD Room #105',
    phone: phone || '+91 98000 00000',
    email: docEmail
  };

  store.doctors.push(newDoc);

  store.users.push({
    id: `usr-${newDocId}`,
    name: formattedName,
    email: docEmail,
    role: 'Doctor',
    department: newDoc.department
  });

  res.json({
    success: true,
    message: `Doctor ${newDoc.name} created! Login credentials generated for ${docEmail}`,
    doctor: newDoc
  });
});

app.delete('/api/doctors/:id', (req, res) => {
  const index = store.doctors.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    const removed = store.doctors.splice(index, 1);
    res.json({ success: true, message: `Doctor ${removed[0].name} removed` });
  } else {
    res.status(404).json({ success: false, message: 'Doctor not found' });
  }
});

// --- 8. SMART BED RECOMMENDATION & ADMISSION API ---
app.post('/api/admissions/recommend-bed', (req, res) => {
  const { ward, priority, requireVentilator, requireOxygen } = req.body;

  let availableBeds = store.beds.filter(b => b.status === 'Available');
  if (ward && ward !== 'all') {
    availableBeds = availableBeds.filter(b => b.ward.toLowerCase() === ward.toLowerCase());
  }

  const recommendations = availableBeds.map(bed => {
    let matchScore = 85;
    if (requireVentilator && bed.features.includes('Ventilator')) matchScore += 10;
    if (requireOxygen && bed.features.includes('O2 Outlet')) matchScore += 5;
    if (priority === 'High' || priority === 'Emergency') matchScore += 5;

    return {
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      features: bed.features,
      suitabilityScore: `${Math.min(99, matchScore)}% Match`,
      recommendedNote: `Suitable for ${priority || 'Standard'} patient intake (${bed.ward})`
    };
  }).slice(0, 3);

  res.json({ success: true, recommendations });
});

app.post('/api/admissions/allocate', (req, res) => {
  const { bedId, patientName, diagnosis, doctorName, priority } = req.body;
  const bed = store.beds.find(b => b.id === bedId || b.bedNumber === bedId);

  if (bed && bed.status === 'Available') {
    bed.status = 'Occupied';
    bed.patient = patientName;
    bed.doctor = doctorName || 'Dr. Sunita Rao';
    bed.admissionDate = new Date().toISOString().split('T')[0];

    const newAdmission = {
      id: `adm-${Date.now()}`,
      patientName,
      diagnosis: diagnosis || 'General Medical Admission',
      priority: priority || 'Standard',
      ward: bed.ward,
      bedNumber: bed.bedNumber,
      doctor: bed.doctor,
      status: 'Admitted',
      admissionDate: bed.admissionDate
    };

    store.admissions.unshift(newAdmission);
    res.json({ success: true, message: `Bed ${bed.bedNumber} allocated to ${patientName}`, admission: newAdmission, bed });
  } else {
    res.status(400).json({ success: false, message: 'Selected bed is not available for allocation' });
  }
});

// --- 9. DISCHARGE WORKFLOW ---
app.post('/api/discharges/process', (req, res) => {
  const { bedId } = req.body;
  const bed = store.beds.find(b => b.id === bedId || b.bedNumber === bedId);

  if (bed) {
    const formerPatient = bed.patient;
    bed.status = 'Cleaning';
    bed.patient = null;
    bed.doctor = null;

    setTimeout(() => {
      if (bed.status === 'Cleaning') {
        bed.status = 'Available';
      }
    }, 15000);

    res.json({
      success: true,
      message: `Discharged ${formerPatient || 'patient'}. Bed ${bed.bedNumber} marked for Disinfection / Cleaning.`,
      bed
    });
  } else {
    res.status(404).json({ success: false, message: 'Bed not found' });
  }
});

// --- 10. EMERGENCY MODE INTAKE API ---
app.post('/api/emergency/create', (req, res) => {
  const { patientName, age, gender } = req.body;

  const emergToken = `EM-${String(store.queue.length + 500).padStart(3, '0')}`;
  const emergItem = {
    id: `emg-${Date.now()}`,
    tokenNumber: emergToken,
    patientName: patientName || 'Emergency Trauma Intake',
    age: age || 35,
    gender: gender || 'Male',
    phone: '+91 91100 00911',
    department: 'Emergency',
    doctor: 'Dr. Vikram Malhotra',
    doctorId: 'doc-2',
    waitTime: 0,
    patientsAhead: 0,
    room: 'ER Bay #01',
    priority: 'Emergency',
    status: 'In Consultation',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    smsSent: true,
    whatsappSent: true
  };

  store.queue.unshift(emergItem);
  store.alerts.unshift({
    id: `alt-${Date.now()}`,
    type: 'critical',
    title: '🚨 Emergency Patient Arrived',
    message: `${emergItem.patientName} (${emergToken}) checked in to Emergency ER Bay.`,
    time: 'Just now',
    resolved: false
  });

  res.json({ success: true, message: `Emergency token ${emergToken} created with priority dispatch!`, token: emergItem });
});

// --- 11. BEDS, DEPARTMENTS, ANALYTICS ---
app.get('/api/beds', (req, res) => res.json({ success: true, beds: store.beds }));
app.put('/api/beds/:id', (req, res) => {
  const bed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id);
  if (bed) {
    Object.assign(bed, req.body);
    res.json({ success: true, message: `Bed ${bed.bedNumber} updated`, bed });
  } else {
    res.status(404).json({ success: false, message: 'Bed not found' });
  }
});

app.get('/api/departments', (req, res) => res.json({ success: true, departments: store.departments }));
app.get('/api/patients', (req, res) => res.json({ success: true, patients: store.queue.map(q => ({ id: `P-${q.id}`, name: q.patientName, age: q.age, gender: q.gender, phone: q.phone, department: q.department, doctor: q.doctor, token: q.tokenNumber, visitStatus: q.status, registrationTime: q.registrationTime })) }));

app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    opdHourly: { labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'], values: [14, 38, 62, 54, 40, 22, 35, 29, 18] },
    deptBreakdown: { labels: ['General Med', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Neurology', 'ENT', 'Emergency'], values: [48, 34, 22, 19, 12, 15, 10, 28] },
    bedOccupancyTrend: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icu: [85, 90, 88, 92, 90, 80, 82], general: [72, 75, 78, 80, 76, 70, 74], emergency: [60, 68, 82, 75, 88, 65, 70] }
  });
});

app.get('/api/insights', (req, res) => {
  res.json({
    success: true,
    insights: [
      { id: 'ins-1', category: 'OPD Flow Optimization', icon: 'zap', text: 'Cardiology queue is 42% higher than hospital average. Assign Dr. H. Deshmukh to OPD Room #105 to reduce wait by 18 mins.', priority: 'high' },
      { id: 'ins-2', category: 'Bed Capacity Warning', icon: 'alert-triangle', text: 'ICU occupancy has reached 90%. Hospital administration should prepare overflow units or process discharge for ICU-003.', priority: 'critical' },
      { id: 'ins-3', category: 'Staff Availability', icon: 'check-circle2', text: 'Three doctors are currently available in departments experiencing moderate queue volume.', priority: 'positive' }
    ],
    alerts: store.alerts
  });
});

app.get('/api/reports', (req, res) => res.json({ success: true, summary: { generatedAt: new Date().toLocaleString(), hospitalName: 'HOSPITIQ Central Hospital', totalOpdFootfall: 218, avgWaitTimeMins: 22, totalAdmissionsToday: 14, totalDischargesToday: 9, bedOccupancyRate: '82%' } }));
app.post('/api/alerts/:id/resolve', (req, res) => {
  const alert = store.alerts.find(a => a.id === req.params.id);
  if (alert) { alert.resolved = true; res.json({ success: true, alert }); }
});

app.get('*', (req, res) => {
  const mainPath = path.join(__dirname, '../public/index.html');
  res.sendFile(mainPath);
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
      console.warn(`⚠️  Port ${currentPort} is currently in use. Trying port ${currentPort + 1}...`);
      startServer(currentPort + 1);
    } else {
      console.error('Server error:', err);
    }
module.exports = app;

if (!process.env.VERCEL && require.main === module) {
  startServer(PORT);
}
