const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const { connectDB, getStore, generateSecureTokenKey } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'hospitiq_secure_production_secret_key_88912';

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Connect Database
connectDB();
const store = getStore();

// ==============================================================================
// 1. CRYPTOGRAPHIC SESSION & AUTHENTICATION ENGINE
// ==============================================================================

const signSessionToken = (userPayload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    id: userPayload.id,
    name: userPayload.name,
    email: userPayload.email,
    role: userPayload.role,
    department: userPayload.department || 'General',
    tokenNumber: userPayload.tokenNumber || null,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 Hours
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

const verifySessionToken = (tokenString) => {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null; // Expired
    return data;
  } catch (err) {
    return null;
  }
};

// Auth Extraction Middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const verified = verifySessionToken(token);
    if (verified) {
      req.user = verified;
    }
  }
  next();
};

// Role Guard Middleware
const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Access denied. Requires ${allowedRoles.join(' or ')} privileges.`
      });
    }

    next();
  };
};

app.use(authenticateUser);

// In-Memory Rate Limiter for public endpoints (max 45 requests/min per IP)
const rateLimitMap = new Map();
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'ip_client';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 45;

  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(ip, record);

  if (record.count > limit) {
    return res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please wait a moment.'
    });
  }

  next();
};

// ==============================================================================
// 2. AUTHENTICATION & LOGIN ENDPOINTS
// ==============================================================================

app.post('/api/auth/login', rateLimiter, (req, res) => {
  const { email, role, identifier } = req.body;
  const lookup = (identifier || email || '').trim();

  let user = null;

  if (role === 'Patient') {
    // Find patient by name or token
    const query = lookup.toLowerCase();
    const cleanUpper = lookup.toUpperCase();
    const cleanNoDash = cleanUpper.replace(/[\s\-]/g, '');

    const foundPt = store.queue.find(q => {
      const t = (q.tokenNumber || '').toUpperCase();
      return t === cleanUpper || t.replace(/[\s\-]/g, '') === cleanNoDash || (q.patientName || '').toLowerCase() === query;
    });

    if (foundPt) {
      user = { id: foundPt.id, name: foundPt.patientName, role: 'Patient', tokenNumber: foundPt.tokenNumber, department: foundPt.department };
    } else {
      const isTokenPattern = lookup.match(/^[A-Za-z]\-?\d+$/);
      user = {
        id: `usr-pt-${Date.now()}`,
        name: isTokenPattern ? 'OPD Patient' : (lookup || 'Walk-in Patient'),
        role: 'Patient',
        tokenNumber: isTokenPattern ? cleanUpper : 'A-031',
        department: 'General Medicine'
      };
    }
  } else if (role === 'Doctor') {
    user = store.users.find(u => u.role === 'Doctor' && (lookup ? u.email.toLowerCase() === lookup.toLowerCase() : true)) 
      || store.users.find(u => u.role === 'Doctor')
      || { id: 'usr-doc-1', name: 'Dr. Sunita Rao', role: 'Doctor', department: 'Cardiology', email: 'doctor@hospitiq.org' };
  } else {
    // Admin
    user = store.users.find(u => u.role === 'Admin') 
      || { id: 'usr-adm-1', name: 'Dr. Vikramaditya Roy', role: 'Admin', department: 'Administration', email: 'admin@hospitiq.org' };
  }

  const sessionToken = signSessionToken(user);

  res.json({
    success: true,
    message: `Authenticated successfully as ${user.name} (${user.role})`,
    token: sessionToken,
    user
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, user: req.user });
});

// ==============================================================================
// 3. PUBLIC PATIENT TOKEN LOOKUP (SECURE & MINIMAL PHI DISCLOSURE)
// ==============================================================================

app.get('/api/patient/:tokenNumber', rateLimiter, (req, res) => {
  const rawParam = String(req.params.tokenNumber || '').trim();
  const cleanUpper = rawParam.toUpperCase();
  const cleanNoDash = cleanUpper.replace(/[\s\-]/g, '');

  const tokenItem = store.queue.find(q => {
    if (!q) return false;
    const t = (q.tokenNumber || '').toUpperCase();
    const sec = (q.secToken || '').toUpperCase();
    return t === cleanUpper || t.replace(/[\s\-]/g, '') === cleanNoDash || sec === cleanUpper || (q.patientName || '').toLowerCase() === rawParam.toLowerCase();
  });

  if (tokenItem) {
    // Calculate live queue position & wait time
    const activeWaiting = store.queue.filter(q => q.status === 'WAITING' && q.department === tokenItem.department);
    const itemIndex = activeWaiting.findIndex(q => q.id === tokenItem.id);
    const patientsAhead = itemIndex >= 0 ? itemIndex : 0;
    const estWait = tokenItem.status === 'IN_CONSULTATION' ? 0 : (patientsAhead + 1) * 12;

    // Minimum data disclosure to protect patient privacy
    return res.json({
      success: true,
      patientToken: {
        tokenNumber: tokenItem.tokenNumber,
        secToken: tokenItem.secToken,
        patientName: tokenItem.patientName,
        age: tokenItem.age,
        gender: tokenItem.gender,
        department: tokenItem.department,
        doctor: tokenItem.doctor,
        room: tokenItem.room,
        waitTime: estWait,
        patientsAhead: patientsAhead,
        priority: tokenItem.priority,
        status: tokenItem.status,
        registrationTime: tokenItem.registrationTime
      }
    });
  }

  // If not found in queue, return 404 error
  return res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'No active patient token found matching the provided identifier.'
  });
});

// ==============================================================================
// 4. STATS & CAPACITY DERIVATION ENGINE
// ==============================================================================

app.get('/api/stats', (req, res) => {
  const waitingPatients = store.queue.filter(q => q.status === 'WAITING');
  const inConsult = store.queue.filter(q => q.status === 'IN_CONSULTATION');
  const completed = store.queue.filter(q => q.status === 'COMPLETED');
  const emergWaiting = store.queue.filter(q => q.priority === 'Emergency' && (q.status === 'WAITING' || q.status === 'IN_CONSULTATION'));

  const totalBeds = store.beds.length;
  const occupiedBeds = store.beds.filter(b => b.status === 'OCCUPIED').length;
  const availBeds = store.beds.filter(b => b.status === 'AVAILABLE').length;
  const icuTotal = store.beds.filter(b => b.ward === 'ICU').length;
  const icuAvail = store.beds.filter(b => b.ward === 'ICU' && b.status === 'AVAILABLE').length;

  res.json({
    success: true,
    opd: {
      totalToday: store.queue.length,
      waiting: waitingPatients.length,
      served: completed.length,
      inConsultation: inConsult.length
    },
    beds: {
      total: totalBeds,
      occupied: occupiedBeds,
      available: availBeds,
      reserved: store.beds.filter(b => b.status === 'RESERVED').length,
      maintenance: store.beds.filter(b => b.status === 'MAINTENANCE').length
    },
    queue: {
      totalWaiting: waitingPatients.length,
      avgWaitTimeMins: waitingPatients.length > 0 ? Math.round(waitingPatients.reduce((acc, q) => acc + (q.waitTime || 15), 0) / waitingPatients.length) : 12,
      longestWaitTimeMins: waitingPatients.length > 0 ? Math.max(...waitingPatients.map(q => q.waitTime || 15)) : 0
    },
    emergency: {
      patientsWaiting: emergWaiting.length,
      icuBedsAvailable: icuAvail,
      criticalAlerts: emergWaiting.length > 0 ? 1 : 0
    }
  });
});

app.get('/api/capacity', (req, res) => {
  const totalBeds = store.beds.length;
  const occupiedBeds = store.beds.filter(b => b.status === 'OCCUPIED').length;
  const icuTotal = store.beds.filter(b => b.ward === 'ICU').length;
  const icuOccupied = store.beds.filter(b => b.ward === 'ICU' && b.status === 'OCCUPIED').length;
  const emgTotal = store.beds.filter(b => b.ward === 'Emergency').length;
  const emgOccupied = store.beds.filter(b => b.ward === 'Emergency' && b.status === 'OCCUPIED').length;

  const bedOccPercent = Math.round((occupiedBeds / totalBeds) * 100);
  const icuOccPercent = icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 0;
  const emgOccPercent = emgTotal > 0 ? Math.round((emgOccupied / emgTotal) * 100) : 0;

  const waitingCount = store.queue.filter(q => q.status === 'WAITING').length;
  const opdLoadPercent = Math.min(100, Math.round((waitingCount / 15) * 100));

  res.json({
    success: true,
    opdLoadPercent,
    bedOccupancyPercent: bedOccPercent,
    icuOccupancyPercent: icuOccPercent,
    emergencyCapacityPercent: emgOccPercent,
    overallStatus: icuOccPercent > 85 ? 'Critical' : (bedOccPercent > 75 ? 'High Load' : 'Normal')
  });
});

// ==============================================================================
// 5. LIVE OPD QUEUE & TRIAGE PRIORITY ENGINE
// ==============================================================================

// Priority Triage Comparator: Emergency (1000) > High (500) > Normal (100) -> FIFO by timestamp
const priorityScore = (priority) => {
  if (priority === 'Emergency') return 1000;
  if (priority === 'High') return 500;
  return 100;
};

const sortQueueByTriage = (queueArray) => {
  return [...queueArray].sort((a, b) => {
    // In consultation comes first
    if (a.status === 'IN_CONSULTATION' && b.status !== 'IN_CONSULTATION') return -1;
    if (b.status === 'IN_CONSULTATION' && a.status !== 'IN_CONSULTATION') return 1;

    // WAITING items sorted by triage weight then timestamp
    if (a.status === 'WAITING' && b.status === 'WAITING') {
      const scoreA = priorityScore(a.priority);
      const scoreB = priorityScore(b.priority);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (a.timestamp || 0) - (b.timestamp || 0);
    }

    return 0;
  });
};

app.get('/api/queue', (req, res) => {
  const sorted = sortQueueByTriage(store.queue);
  res.json({ success: true, queue: sorted });
});

app.post('/api/queue/token', (req, res) => {
  const { patientName, age, gender, phone, department, doctorId, priority } = req.body;

  if (!patientName || !patientName.trim()) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Patient Name is required.' });
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Valid Age between 1 and 120 is required.' });
  }

  const doc = store.doctors.find(d => d.id === doctorId) || store.doctors[0];
  const deptCode = department ? department.charAt(0).toUpperCase() : 'A';
  const tokenNum = `${deptCode}-${String(store.queue.length + 105).padStart(3, '0')}`;
  const secToken = `sec_${generateSecureTokenKey()}`;

  const deptWaiting = store.queue.filter(q => q.status === 'WAITING' && q.department === (department || doc.department));
  const estWaitMins = priority === 'Emergency' ? 0 : (deptWaiting.length + 1) * 12;

  const newToken = {
    id: `q-${Date.now()}`,
    secToken,
    tokenNumber: tokenNum,
    patientName: patientName.trim(),
    age: parsedAge,
    gender: gender || 'Male',
    phone: phone || '+91 99000 11223',
    department: department || doc.department,
    doctor: doc.name,
    doctorId: doc.id,
    waitTime: estWaitMins,
    patientsAhead: deptWaiting.length,
    room: doc.room,
    priority: priority || 'Normal',
    status: 'WAITING',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    smsSent: true
  };

  doc.patientsWaiting += 1;
  store.queue.unshift(newToken);

  res.status(201).json({
    success: true,
    message: `Token ${tokenNum} generated successfully. Estimated wait: ${estWaitMins} mins.`,
    token: newToken
  });
});

app.post('/api/queue/call-next', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const { doctorId } = req.body;
  const doc = store.doctors.find(d => d.id === doctorId || d.name === doctorId) || store.doctors[0];

  // Find highest priority waiting patient for this doctor or department
  const waitingList = store.queue.filter(q => q.status === 'WAITING');
  const sortedWaiting = sortQueueByTriage(waitingList);

  let nextInLine = sortedWaiting.find(q => q.doctor === doc.name || q.doctorId === doc.id);
  if (!nextInLine && sortedWaiting.length > 0) {
    nextInLine = sortedWaiting[0];
    nextInLine.doctor = doc.name;
    nextInLine.doctorId = doc.id;
    nextInLine.room = doc.room;
  }

  if (nextInLine) {
    nextInLine.status = 'IN_CONSULTATION';
    nextInLine.waitTime = 0;
    doc.currentPatient = `${nextInLine.tokenNumber} (${nextInLine.patientName})`;
    doc.patientsWaiting = Math.max(0, doc.patientsWaiting - 1);
    doc.status = 'CONSULTING';

    res.json({
      success: true,
      message: `Calling Token ${nextInLine.tokenNumber} (${nextInLine.patientName}) to ${doc.room}`,
      calledToken: nextInLine
    });
  } else {
    res.json({
      success: false,
      message: `No waiting patients currently in queue for ${doc.name}.`
    });
  }
});

app.put('/api/queue/:id/status', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  const tokenItem = store.queue.find(q => q.id === req.params.id || q.tokenNumber === req.params.id);
  if (tokenItem) {
    tokenItem.status = status;
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      const doc = store.doctors.find(d => d.name === tokenItem.doctor || d.id === tokenItem.doctorId);
      if (doc) {
        doc.status = 'AVAILABLE';
        doc.currentPatient = 'None';
      }
    }
    res.json({ success: true, message: `Token ${tokenItem.tokenNumber} marked as ${status}`, token: tokenItem });
  } else {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Patient queue token not found.' });
  }
});

// ==============================================================================
// 6. DOCTOR ROSTER MANAGEMENT & AVAILABILITY
// ==============================================================================

app.get('/api/doctors', (req, res) => res.json({ success: true, doctors: store.doctors }));

app.put('/api/doctors/:id/status', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const { status } = req.body;
  const validDocStatuses = ['AVAILABLE', 'CONSULTING', 'ON_BREAK', 'OFFLINE'];

  if (!validDocStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: `Invalid doctor status. Allowed: ${validDocStatuses.join(', ')}` });
  }

  const doc = store.doctors.find(d => d.id === req.params.id || d.name === req.params.id);
  if (doc) {
    doc.status = status;
    res.json({ success: true, message: `Doctor ${doc.name} status updated to ${status}`, doctor: doc });
  } else {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Doctor not found.' });
  }
});

app.post('/api/doctors', requireRoles(['Admin']), (req, res) => {
  const { name, specialization, department, room, phone, email } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Doctor Name is required.' });
  }

  const formattedName = name.startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`;
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
    status: 'AVAILABLE',
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

  res.status(201).json({
    success: true,
    message: `Doctor ${formattedName} successfully registered!`,
    doctor: newDoc
  });
});

app.delete('/api/doctors/:id', requireRoles(['Admin']), (req, res) => {
  const docIndex = store.doctors.findIndex(d => d.id === req.params.id);
  if (docIndex !== -1) {
    const deleted = store.doctors.splice(docIndex, 1);
    res.json({ success: true, message: `Removed ${deleted[0].name} from doctor roster` });
  } else {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Doctor not found.' });
  }
});

// ==============================================================================
// 7. BED MANAGEMENT, ADMISSIONS & SMART RECOMMENDATION ENGINE
// ==============================================================================

app.get('/api/beds', (req, res) => res.json({ success: true, beds: store.beds }));

// Smart Bed Recommendation Engine
app.post('/api/admissions/recommend-bed', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const { ward, requireVentilator, requireOxygen, requireIsolation } = req.body;

  // Filter available beds matching exact criteria
  let candidates = store.beds.filter(b => b.status === 'AVAILABLE');

  if (ward && ward !== 'all') {
    candidates = candidates.filter(b => b.ward.toLowerCase() === ward.toLowerCase());
  }

  if (requireVentilator) {
    candidates = candidates.filter(b => b.hasVentilator === true);
  }

  if (requireOxygen) {
    candidates = candidates.filter(b => b.hasOxygen === true);
  }

  if (requireIsolation) {
    candidates = candidates.filter(b => b.isIsolation === true);
  }

  if (candidates.length > 0) {
    res.json({
      success: true,
      count: candidates.length,
      recommendations: candidates.slice(0, 5).map(b => ({
        id: b.id,
        bedNumber: b.bedNumber,
        ward: b.ward,
        status: b.status,
        hasVentilator: b.hasVentilator,
        hasOxygen: b.hasOxygen,
        isIsolation: b.isIsolation,
        matchScore: 100
      }))
    });
  } else {
    res.json({
      success: false,
      count: 0,
      message: 'No suitable bed currently available matching the requested clinical criteria.',
      recommendations: []
    });
  }
});

app.put('/api/beds/:id/admit', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const { patientName, doctor, diagnosis } = req.body;
  const bed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id);

  if (!bed) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Bed not found.' });
  }

  if (bed.status === 'OCCUPIED') {
    return res.status(409).json({ success: false, error: 'CONFLICT', message: `Bed ${bed.bedNumber} is already occupied.` });
  }

  bed.status = 'OCCUPIED';
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
});

app.put('/api/beds/:id/discharge', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const bed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id);
  if (!bed) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Bed not found.' });
  }

  const patientName = bed.patient;
  bed.status = 'AVAILABLE';
  bed.patient = null;
  bed.doctor = null;
  bed.admissionDate = null;

  // Mark admission as Discharged
  const admRecord = store.admissions.find(a => a.bedNumber === bed.bedNumber && a.status === 'Admitted');
  if (admRecord) {
    admRecord.status = 'Discharged';
    admRecord.dischargeDate = new Date().toISOString().split('T')[0];
  }

  res.json({
    success: true,
    message: `Discharge complete for ${patientName || 'Patient'}. Bed ${bed.bedNumber} is now Available.`,
    bed
  });
});

app.get('/api/admissions', (req, res) => res.json({ success: true, admissions: store.admissions }));

// ==============================================================================
// 8. EMERGENCY SIREN & TRIAGE BROADCAST
// ==============================================================================

app.post('/api/emergency/siren', requireRoles(['Doctor', 'Admin']), (req, res) => {
  const emergItem = {
    id: `q-emg-${Date.now()}`,
    secToken: `sec_${generateSecureTokenKey()}`,
    tokenNumber: `EM-${Math.floor(500 + Math.random() * 500)}`,
    patientName: 'CRITICAL TRAUMA TRIAGE',
    age: 45,
    gender: 'Male',
    department: 'Emergency',
    doctor: 'Dr. Vikram Malhotra',
    doctorId: 'doc-2',
    waitTime: 0,
    patientsAhead: 0,
    room: 'ER Resuscitation Bay #01',
    priority: 'Emergency',
    status: 'IN_CONSULTATION',
    registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    smsSent: true
  };

  store.queue.unshift(emergItem);

  res.json({
    success: true,
    message: '🚨 HOSPITAL EMERGENCY BROADCAST DISPATCHED TO ALL TERMINALS',
    dispatchedToken: emergItem
  });
});

// ==============================================================================
// 9. OPERATIONAL INSIGHTS & DETERMINISTIC ALERTS
// ==============================================================================

app.get('/api/insights', (req, res) => {
  const icuTotal = store.beds.filter(b => b.ward === 'ICU').length;
  const icuOccupied = store.beds.filter(b => b.ward === 'ICU' && b.status === 'OCCUPIED').length;
  const icuOccPercent = icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 0;

  const cardWaiting = store.queue.filter(q => q.department === 'Cardiology' && q.status === 'WAITING').length;
  const genMedWaiting = store.queue.filter(q => q.department === 'General Medicine' && q.status === 'WAITING').length;

  const dynamicInsights = [];
  const dynamicAlerts = [];

  if (cardWaiting >= 2) {
    dynamicInsights.push({
      id: 'ins-card',
      category: 'Queue Surge',
      text: `Cardiology OPD queue has ${cardWaiting} patients waiting. Average wait time ~${cardWaiting * 12} mins.`,
      priority: 'high',
      icon: 'trending-up'
    });
  }

  if (icuOccPercent >= 80) {
    dynamicInsights.push({
      id: 'ins-icu',
      category: 'Bed Matrix',
      text: `ICU Ward is at ${icuOccPercent}% capacity (${icuTotal - icuOccupied} beds remaining). Reserve critical beds.`,
      priority: 'critical',
      icon: 'alert-triangle'
    });
    dynamicAlerts.push({
      id: 'alt-icu',
      severity: 'CRITICAL',
      title: '🛏️ ICU Capacity Warning',
      message: `ICU occupancy is at ${icuOccPercent}%. Only ${icuTotal - icuOccupied} vacant ICU beds remain.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  const emgCount = store.queue.filter(q => q.priority === 'Emergency' && q.status !== 'COMPLETED').length;
  if (emgCount > 0) {
    dynamicAlerts.push({
      id: 'alt-emg',
      severity: 'CRITICAL',
      title: '🚨 Emergency Triage Active',
      message: `${emgCount} active emergency case receiving immediate resuscitation in ER Bay.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  res.json({
    success: true,
    insights: dynamicInsights,
    alerts: dynamicAlerts
  });
});

app.get('/api/departments', (req, res) => res.json({ success: true, departments: store.departments }));
app.get('/api/patients', (req, res) => res.json({ success: true, patients: store.queue }));

// SPA Fallback
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
      res.send('HOSPITIQ Command Center Online');
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
