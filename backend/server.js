const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB, isDBConnected, getStore, generateSecureTokenKey, models } = require('./db');
const { Token, Patient, Doctor, Bed, Admission, User, Alert } = models;

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
    id: userPayload.id || userPayload._id,
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
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch (err) {
    return null;
  }
};

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

// Ensure Database connection is active for API routes in serverless lifecycle
const ensureDbConnection = async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    if (!isDBConnected()) {
      await connectDB();
    }
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Unable to connect to hospital database. Please ensure MongoDB Atlas Network Access allows connections (0.0.0.0/0).'
      });
    }
  }
  next();
};
app.use(ensureDbConnection);

// Rate Limiter
const rateLimitMap = new Map();
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'ip_client';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 60;

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

// Priority helper for clinical P1-P5 ordering
const priorityWeight = (p) => {
  const norm = String(p || '').toUpperCase().trim();
  if (norm === 'P1' || norm === 'IMMEDIATE') return 5000;
  if (norm === 'P2' || norm === 'EMERGENCY') return 4000;
  if (norm === 'P3' || norm === 'HIGH' || norm === 'URGENT') return 3000;
  if (norm === 'P4' || norm === 'NORMAL' || norm === 'LESS URGENT') return 2000;
  if (norm === 'P5' || norm === 'NON-URGENT' || norm === 'NON_URGENT') return 1000;
  return 2000;
};

// --- AI Clinical Triage NLP Engine with Real-time Pain Scale & Category Mapping ---
const evaluateTriage = (description = '', patientReportedUrgency = 'Normal', rawPainScore = 3, rawCategory = '') => {
  const text = String(description || '').toLowerCase().trim();
  const painScore = Math.max(0, Math.min(10, parseInt(rawPainScore, 10) || 0));

  const redFlags = [];
  const symptoms = [];
  let suggestedPriority = 'P4';
  let severity = 'Moderate';
  let reason = 'Standard outpatient evaluation recommended.';
  let requiresHumanReview = false;
  let category = rawCategory || 'General & Routine';
  let emergencySlot = '';

  // 1. Evaluate Clinical Category from NLP if not explicitly selected
  if (/\b(chest|heart|angina|cardiac|palpitation|pressure in chest|stent)\b/i.test(text)) {
    category = 'Cardiac & Chest';
  } else if (/\b(breath|dyspnea|asthma|wheezing|cough|choking|airway|stridor|oxygen|suffocating)\b/i.test(text)) {
    category = 'Respiratory & Airway';
  } else if (/\b(stroke|unconscious|slurred speech|paralysis|facial droop|seizure|headache|faint|syncope|vertigo)\b/i.test(text)) {
    category = 'Neurological & Stroke';
  } else if (/\b(bleed|blood|cut|stab|accident|burn|trauma|wound|laceration|fall|injury|hemorrhage)\b/i.test(text)) {
    category = 'Trauma, Burns & Bleeding';
  } else if (/\b(stomach|abdomen|vomit|diarrhea|nausea|cramp|appendix|gallbladder|gastric|acid)\b/i.test(text)) {
    category = 'Abdominal & Gastrointestinal';
  } else if (/\b(fracture|bone|dislocation|sprain|joint|knee|ankle|cannot walk|swelling|wrist)\b/i.test(text)) {
    category = 'Orthopedic & Fractures';
  } else if (/\b(fever|chills|infection|cold|flu|shivering|temperature|covid|dengue)\b/i.test(text)) {
    category = 'Infection & High Fever';
  } else if (/\b(refill|prescription|renewal|routine checkup|medical certificate|follow up|fitness|report)\b/i.test(text)) {
    category = 'General & Prescription Refill';
  }

  // 2. Visual Analog Pain Scale (VAS 1-10) Real-time Integration
  if (painScore >= 9) {
    redFlags.push(`Excruciating Acute Pain (VAS ${painScore}/10)`);
    symptoms.push(`Severe Pain (VAS ${painScore}/10)`);
    severity = 'Severe';
    suggestedPriority = 'P2';
    reason = `Critical pain score (VAS ${painScore}/10) reported. Fast-track emergency slot allocation required.`;
    requiresHumanReview = true;
  } else if (painScore >= 7) {
    symptoms.push(`Severe Pain (VAS ${painScore}/10)`);
    severity = 'Severe';
    suggestedPriority = 'P3';
    reason = `Severe acute pain (VAS ${painScore}/10) requiring urgent clinical attention (< 30 mins).`;
    requiresHumanReview = true;
  } else if (painScore >= 4) {
    symptoms.push(`Moderate Pain (VAS ${painScore}/10)`);
  }

  // 3. Immediate Life Threat (P1) Detection
  const p1Conditions = [
    { pattern: /\b(unconscious|not breathing|cardiac arrest|respiratory arrest|collapsed and unresponsive|choking|airway obstruction|cyanosis|turning blue|severe anaphylaxis|massive hemorrhage|severe shock)\b/i, flag: 'Critical Airway / Circulatory / Consciousness Collapse' },
    { pattern: /\b(unresponsive|no pulse|gasping for air|stridor)\b/i, flag: 'Acute Airway/Ventilation Failure' }
  ];

  for (const c of p1Conditions) {
    if (c.pattern.test(text)) {
      redFlags.push(c.flag);
      symptoms.push('Unconsciousness / Airway Compromise');
      suggestedPriority = 'P1';
      severity = 'Critical';
      reason = 'Immediate life-threat detected: Airway, Breathing, or Circulatory collapse. Zero-delay resuscitation slot assigned.';
      requiresHumanReview = true;
      break;
    }
  }

  // 4. Emergency / Acute Red Flags (P2) Detection (If not P1)
  if (suggestedPriority !== 'P1') {
    const p2Conditions = [
      { pattern: /\b(chest|heart attack|angina|tightness in chest|pressure in chest|radiating to arm|radiating to jaw|cardiac|palpitation)\b/i, flag: 'Acute Chest Pain / Suspected ACS', sym: 'Cardiac Chest Discomfort' },
      { pattern: /\b(difficulty breathing|shortness of breath|breathless|struggling to breathe|dyspnea|severe asthma|suffocating)\b/i, flag: 'Acute Respiratory Distress', sym: 'Severe Dyspnea' },
      { pattern: /\b(slurred speech|facial droop|one sided weakness|stroke|sudden vision loss|paralysis|syncope)\b/i, flag: 'Acute Neurological Deficit / Stroke Protocol', sym: 'Suspected Acute Stroke' },
      { pattern: /\b(heavy bleeding|uncontrolled bleeding|coughing up blood|hemoptysis|vomiting blood|hematemesis)\b/i, flag: 'Active Severe Hemorrhage', sym: 'Severe Bleeding' },
      { pattern: /\b(severe head injury|major accident|deep laceration|stab wound|gunshot|high voltage burn)\b/i, flag: 'Major Acute Trauma', sym: 'Severe Trauma' },
      { pattern: /\b(severe abdominal pain|excruciating pain|pain 9\/10|pain 10\/10|unbearable pain)\b/i, flag: 'Acute Severe Pain', sym: 'Severe Acute Pain' },
      { pattern: /\b(seizure|convulsion|diabetic coma|severe hypoglycemia)\b/i, flag: 'Acute Neurological Instability', sym: 'Seizure' }
    ];

    for (const c of p2Conditions) {
      if (c.pattern.test(text)) {
        redFlags.push(c.flag);
        symptoms.push(c.sym);
        suggestedPriority = 'P2';
        severity = 'Severe';
        reason = `Emergency red flag identified: ${c.flag}. Urgent medical intervention required (< 15 mins).`;
        requiresHumanReview = true;
      }
    }

    if (category === 'Cardiac & Chest' && painScore >= 6) {
      suggestedPriority = 'P2';
      severity = 'Severe';
      if (!redFlags.includes('Acute Cardiac Symptom with High Pain')) {
        redFlags.push('Acute Cardiac Symptom with High Pain');
      }
      reason = `Acute cardiac/chest symptoms with VAS ${painScore}/10 pain. Fast-track emergency slot assigned.`;
      requiresHumanReview = true;
    }
  }

  // 5. Urgent (P3) Detection (If not P1/P2)
  if (suggestedPriority !== 'P1' && suggestedPriority !== 'P2') {
    const p3Conditions = [
      { pattern: /\b(high fever|chills|shivering|fever 103|fever 104|temperature high)\b/i, sym: 'High Fever' },
      { pattern: /\b(fracture|broken bone|dislocation|sprain severe|cannot walk|swelling severe)\b/i, sym: 'Suspected Fracture / Orthopedic Injury' },
      { pattern: /\b(persistent vomiting|severe diarrhea|dehydration|kidney pain|flank pain)\b/i, sym: 'Gastrointestinal / Renal Distress' },
      { pattern: /\b(moderate pain|pain 6\/10|pain 7\/10|moderate chest discomfort|migraine severe)\b/i, sym: 'Moderate Acute Pain' },
      { pattern: /\b(asthma mild|wheezing mild|allergic reaction mild|rash spreading)\b/i, sym: 'Moderate Respiratory / Allergic Symptom' }
    ];

    for (const c of p3Conditions) {
      if (c.pattern.test(text)) {
        symptoms.push(c.sym);
        suggestedPriority = 'P3';
        severity = 'Moderate';
        reason = `Urgent clinical presentation identified: ${c.sym}. Medical attention recommended within 30 minutes.`;
        requiresHumanReview = true;
      }
    }
  }

  // 6. Non-Urgent (P5) Confirmation
  const isP5Refill = /\b(refill|prescription|renewal|routine checkup|medical certificate|follow up|fitness certificate|general checkup|skin rash mild|routine test|report collection)\b/i.test(text);
  const isPainOrEmergency = painScore >= 4 || /\b(pain|bleed|breath|unconscious|chest|heart|stroke|fracture|burn|vomit|fever|severe|acute|accident)\b/i.test(text);

  if (isP5Refill && !isPainOrEmergency && suggestedPriority !== 'P1' && suggestedPriority !== 'P2' && suggestedPriority !== 'P3') {
    suggestedPriority = 'P5';
    severity = 'Minimal';
    symptoms.push('Routine Prescription / Administrative Request');
    reason = 'Patient described routine administrative or prescription refill request with no acute red flags.';
    requiresHumanReview = false;
  }

  // 7. Less Urgent (P4) Default
  if (suggestedPriority !== 'P1' && suggestedPriority !== 'P2' && suggestedPriority !== 'P3' && suggestedPriority !== 'P5') {
    suggestedPriority = 'P4';
    severity = 'Mild';
    symptoms.push('Mild Symptom / Routine Consultation');
    reason = 'Mild or subacute condition with no immediate red flags. Standard OPD queue allocation.';
  }

  // 8. Dedicated Emergency Slot Allocation
  if (suggestedPriority === 'P1') {
    emergencySlot = 'ER-Bay-01 (Resuscitation Bay)';
  } else if (suggestedPriority === 'P2') {
    emergencySlot = 'ER-Bay-02 (Cardiac / Trauma Slot)';
  } else if (suggestedPriority === 'P3' && (category.includes('Trauma') || category.includes('Cardiac'))) {
    emergencySlot = 'ER-Bay-03 (Urgent Assessment Slot)';
  }

  const uniqueSymptoms = [...new Set(symptoms)];
  const uniqueRedFlags = [...new Set(redFlags)];

  return {
    aiSuggestedPriority: suggestedPriority,
    aiSymptoms: uniqueSymptoms.length > 0 ? uniqueSymptoms : ['General Clinical Assessment'],
    aiSeverity: severity,
    aiRedFlags: uniqueRedFlags,
    aiReason: reason,
    symptomCategory: category,
    painScore: painScore,
    emergencySlot: emergencySlot,
    triageStatus: requiresHumanReview ? 'PENDING_REVIEW' : 'CONFIRMED',
    finalTriagePriority: suggestedPriority
  };
};

// ==============================================================================
// 2. AUTHENTICATION ENDPOINTS
// ==============================================================================

app.post('/api/auth/login', rateLimiter, async (req, res) => {
  const { email, role, identifier, patientName, tokenNumber } = req.body;
  const lookupToken = (tokenNumber || identifier || '').trim().toUpperCase();
  const lookupName = (patientName || identifier || '').trim();

  let user = null;

  try {
    if (role === 'Patient') {
      const cleanUpper = lookupToken.toUpperCase();
      const cleanNoDash = cleanUpper.replace(/[\s\-]/g, '');

      if (isDBConnected()) {
        const queries = [];
        if (cleanUpper) {
          queries.push({ tokenNumber: cleanUpper });
          queries.push({ secToken: cleanUpper });
        }
        if (lookupName) {
          queries.push({ patientName: new RegExp(`^${lookupName}$`, 'i') });
        }

        const tokenDoc = await Token.findOne(queries.length > 0 ? { $or: queries } : { tokenNumber: 'A-031' });
        if (tokenDoc) {
          user = {
            id: tokenDoc._id.toString(),
            name: tokenDoc.patientName,
            role: 'Patient',
            tokenNumber: tokenDoc.tokenNumber,
            department: tokenDoc.department
          };
        }
      }

      if (!user) {
        const foundMem = store.queue.find(q => {
          const t = (q.tokenNumber || '').toUpperCase();
          const pName = (q.patientName || '').toLowerCase();
          return (cleanUpper && (t === cleanUpper || t.replace(/[\s\-]/g, '') === cleanNoDash)) ||
                 (lookupName && pName === lookupName.toLowerCase());
        });

        if (foundMem) {
          user = {
            id: foundMem.id,
            name: foundMem.patientName,
            role: 'Patient',
            tokenNumber: foundMem.tokenNumber,
            department: foundMem.department
          };
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'No patient record or token found matching the provided credentials.'
        });
      }
    } else if (role === 'Doctor') {
      const lookupEmail = (email || identifier || '').trim();
      if (isDBConnected()) {
        const docUser = await User.findOne({ role: 'Doctor', ...(lookupEmail ? { email: new RegExp(`^${lookupEmail}$`, 'i') } : {}) });
        if (docUser) user = docUser.toObject();
      }
      if (!user) {
        if (lookupEmail) {
          const memDoc = store.users.find(u => u.role === 'Doctor' && u.email && u.email.toLowerCase() === lookupEmail.toLowerCase());
          if (memDoc) user = memDoc;
        }
        if (!user) {
          user = store.users.find(u => u.role === 'Doctor') || { id: 'usr-doc-1', name: 'Dr. Sunita Rao', role: 'Doctor', department: 'Cardiology', email: 'doctor@hospitiq.org' };
        }
      }
    } else {
      const lookupEmail = (email || identifier || '').trim();
      if (isDBConnected()) {
        const admUser = await User.findOne({ role: 'Admin', ...(lookupEmail ? { email: new RegExp(`^${lookupEmail}$`, 'i') } : {}) });
        if (admUser) user = admUser.toObject();
      }
      if (!user) {
        if (lookupEmail) {
          const memAdm = store.users.find(u => u.role === 'Admin' && u.email && u.email.toLowerCase() === lookupEmail.toLowerCase());
          if (memAdm) user = memAdm;
        }
        if (!user) {
          user = store.users.find(u => u.role === 'Admin') || { id: 'usr-adm-1', name: 'Dr. Vikramaditya Roy', role: 'Admin', department: 'Administration', email: 'admin@hospitiq.org' };
        }
      }
    }

    const sessionToken = signSessionToken(user);

    res.json({
      success: true,
      message: `Authenticated successfully as ${user.name} (${user.role})`,
      token: sessionToken,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Unable to process sign in.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, user: req.user });
});

// ==============================================================================
// 3. SECURE PATIENT TOKEN LOOKUP
// ==============================================================================

app.get('/api/patient/:tokenNumber', rateLimiter, async (req, res) => {
  const rawParam = String(req.params.tokenNumber || '').trim();
  const cleanUpper = rawParam.toUpperCase();
  const cleanNoDash = cleanUpper.replace(/[\s\-]/g, '');

  try {
    let tokenItem = null;

    if (isDBConnected()) {
      tokenItem = await Token.findOne({
        $or: [
          { tokenNumber: cleanUpper },
          { secToken: cleanUpper },
          { patientName: new RegExp(`^${rawParam}$`, 'i') }
        ]
      }).lean();
    }

    if (!tokenItem) {
      tokenItem = store.queue.find(q => {
        const t = (q.tokenNumber || '').toUpperCase();
        const sec = (q.secToken || '').toUpperCase();
        return t === cleanUpper || t.replace(/[\s\-]/g, '') === cleanNoDash || sec === cleanUpper || (q.patientName || '').toLowerCase() === rawParam.toLowerCase();
      });
    }

    if (tokenItem) {
      const waitCount = isDBConnected() 
        ? await Token.countDocuments({ status: 'WAITING', department: tokenItem.department, createdAt: { $lt: tokenItem.createdAt || new Date() } })
        : store.queue.filter(q => q.status === 'WAITING' && q.department === tokenItem.department).length;

      const estWait = tokenItem.status === 'IN_CONSULTATION' ? 0 : Math.max(10, waitCount * 12);

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
          patientsAhead: waitCount,
          priority: tokenItem.priority,
          status: tokenItem.status,
          registrationTime: tokenItem.registrationTime || 'Today'
        }
      });
    }

    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'No active patient token found matching the provided identifier.'
    });
  } catch (err) {
    console.error('Token lookup error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Error retrieving patient token.' });
  }
});

// ==============================================================================
// 4. STATS & CAPACITY
// ==============================================================================

app.get('/api/stats', async (req, res) => {
  try {
    let queueList = store.queue;
    let bedList = store.beds;

    if (isDBConnected()) {
      queueList = await Token.find().lean();
      bedList = await Bed.find().lean();
    }

    const waitingPatients = queueList.filter(q => q.status === 'WAITING');
    const inConsult = queueList.filter(q => q.status === 'IN_CONSULTATION');
    const completed = queueList.filter(q => q.status === 'COMPLETED');
    const emergWaiting = queueList.filter(q => q.priority === 'Emergency' && (q.status === 'WAITING' || q.status === 'IN_CONSULTATION'));

    const totalBeds = bedList.length;
    const occupiedBeds = bedList.filter(b => b.status === 'OCCUPIED').length;
    const availBeds = bedList.filter(b => b.status === 'AVAILABLE').length;
    const icuAvail = bedList.filter(b => b.ward === 'ICU' && b.status === 'AVAILABLE').length;

    res.json({
      success: true,
      opd: {
        totalToday: queueList.length,
        waiting: waitingPatients.length,
        served: completed.length,
        inConsultation: inConsult.length
      },
      beds: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: availBeds,
        reserved: bedList.filter(b => b.status === 'RESERVED').length,
        maintenance: bedList.filter(b => b.status === 'MAINTENANCE').length
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
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Unable to calculate dashboard stats.' });
  }
});

app.get('/api/capacity', async (req, res) => {
  try {
    let bedList = store.beds;
    let queueList = store.queue;

    if (isDBConnected()) {
      bedList = await Bed.find().lean();
      queueList = await Token.find({ status: 'WAITING' }).lean();
    }

    const totalBeds = bedList.length || 100;
    const occupiedBeds = bedList.filter(b => b.status === 'OCCUPIED').length;
    const icuTotal = bedList.filter(b => b.ward === 'ICU').length || 15;
    const icuOccupied = bedList.filter(b => b.ward === 'ICU' && b.status === 'OCCUPIED').length;
    const emgTotal = bedList.filter(b => b.ward === 'Emergency').length || 15;
    const emgOccupied = bedList.filter(b => b.ward === 'Emergency' && b.status === 'OCCUPIED').length;

    const bedOccPercent = Math.round((occupiedBeds / totalBeds) * 100);
    const icuOccPercent = icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 0;
    const emgOccPercent = emgTotal > 0 ? Math.round((emgOccupied / emgTotal) * 100) : 0;

    const waitingCount = queueList.length;
    const opdLoadPercent = Math.min(100, Math.round((waitingCount / 15) * 100));

    res.json({
      success: true,
      opdLoadPercent,
      bedOccupancyPercent: bedOccPercent,
      icuOccupancyPercent: icuOccPercent,
      emergencyCapacityPercent: emgOccPercent,
      overallStatus: icuOccPercent > 85 ? 'Critical' : (bedOccPercent > 75 ? 'High Load' : 'Normal')
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to compute capacity matrix.' });
  }
});

// ==============================================================================
// 5. LIVE OPD QUEUE CRUD & TOKEN PERSISTENCE
// ==============================================================================

app.get('/api/queue', async (req, res) => {
  try {
    let queueData = [];

    if (isDBConnected()) {
      queueData = await Token.find().sort({ createdAt: -1 }).lean();
    } else {
      queueData = store.queue;
    }

    // Sort by priority then status
    const sorted = [...queueData].sort((a, b) => {
      if (a.status === 'IN_CONSULTATION' && b.status !== 'IN_CONSULTATION') return -1;
      if (b.status === 'IN_CONSULTATION' && a.status !== 'IN_CONSULTATION') return 1;
      if (a.status === 'WAITING' && b.status === 'WAITING') {
        const weightA = priorityWeight(a.finalTriagePriority || a.priority);
        const weightB = priorityWeight(b.finalTriagePriority || b.priority);
        if (weightB !== weightA) return weightB - weightA;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return 0;
    });

    res.json({ success: true, queue: sorted });
  } catch (err) {
    console.error('Queue fetch error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Unable to fetch OPD queue.' });
  }
});

// Create/Register Token (Supports both /api/queue/token and /api/tokens)
const handleTokenRegistration = async (req, res) => {
  const { 
    patientName, 
    age, 
    gender, 
    phone, 
    department, 
    doctorId, 
    problemDescription, 
    patientReportedUrgency,
    painScore,
    symptomCategory
  } = req.body;

  if (!patientName || !patientName.trim()) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Patient Name is required.' });
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Valid Age between 1 and 120 is required.' });
  }

  // Run AI Clinical Triage NLP Engine with Real-time Pain Scale & Category
  const rawDesc = (problemDescription || '').trim();
  const triageResult = evaluateTriage(rawDesc, patientReportedUrgency || 'Normal', painScore, symptomCategory);

  try {
    let doc = store.doctors.find(d => d.id === doctorId || d.docId === doctorId);
    if (isDBConnected() && !doc) {
      doc = await Doctor.findOne({ $or: [{ docId: doctorId }, { _id: mongoose.isValidObjectId(doctorId) ? doctorId : null }] }).lean();
    }
    if (!doc) doc = store.doctors[0];

    const deptCode = department ? department.charAt(0).toUpperCase() : 'A';
    const totalCount = isDBConnected() ? await Token.countDocuments() : store.queue.length;
    const tokenNum = `${deptCode}-${String(totalCount + 101).padStart(3, '0')}`;
    const secToken = `sec_${generateSecureTokenKey()}`;

    const waitingInDept = isDBConnected() 
      ? await Token.countDocuments({ status: 'WAITING', department: department || doc.department })
      : store.queue.filter(q => q.status === 'WAITING' && q.department === (department || doc.department)).length;

    let estWaitMins = (waitingInDept + 1) * 12;
    if (triageResult.finalTriagePriority === 'P1') estWaitMins = 0;
    else if (triageResult.finalTriagePriority === 'P2') estWaitMins = Math.min(5, (waitingInDept + 1) * 3);
    else if (triageResult.finalTriagePriority === 'P3') estWaitMins = (waitingInDept + 1) * 8;

    const tokenPayload = {
      tokenNumber: tokenNum,
      secToken,
      patientName: patientName.trim(),
      age: parsedAge,
      gender: gender || 'Male',
      phone: phone || '+91 99000 11223',
      department: department || doc.department,
      doctor: doc.name,
      doctorId: doc.docId || doc.id || 'doc-1',
      room: triageResult.emergencySlot || doc.room || 'OPD Room #104',
      priority: triageResult.finalTriagePriority,
      problemDescription: rawDesc,
      painScore: triageResult.painScore,
      symptomCategory: triageResult.symptomCategory,
      emergencySlot: triageResult.emergencySlot,
      patientReportedUrgency: patientReportedUrgency || 'Normal',
      aiSuggestedPriority: triageResult.aiSuggestedPriority,
      aiSymptoms: triageResult.aiSymptoms,
      aiSeverity: triageResult.aiSeverity,
      aiRedFlags: triageResult.aiRedFlags,
      aiReason: triageResult.aiReason,
      finalTriagePriority: triageResult.finalTriagePriority,
      triageStatus: triageResult.triageStatus,
      reviewedBy: 'System AI',
      status: 'WAITING',
      waitTime: estWaitMins,
      patientsAhead: waitingInDept,
      registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      smsSent: true
    };

    let savedToken = null;

    if (isDBConnected()) {
      // Save Patient
      const newPatient = new Patient({
        name: tokenPayload.patientName,
        age: tokenPayload.age,
        gender: tokenPayload.gender,
        phone: tokenPayload.phone,
        activeTokenNumber: tokenNum,
        department: tokenPayload.department,
        lastProblemDescription: rawDesc,
        lastTriagePriority: triageResult.finalTriagePriority,
        status: 'Waiting'
      });
      const savedPt = await newPatient.save();

      // Save Token
      const newTokenDoc = new Token({
        ...tokenPayload,
        patientId: savedPt._id
      });
      savedToken = await newTokenDoc.save();

      // Update doctor waiting count
      await Doctor.updateOne({ docId: tokenPayload.doctorId }, { $inc: { patientsWaiting: 1 } });
    }

    // Mirror in memory store
    const memToken = {
      id: savedToken ? savedToken._id.toString() : `q-${Date.now()}`,
      ...tokenPayload
    };
    store.queue.unshift(memToken);
    if (doc) doc.patientsWaiting = (doc.patientsWaiting || 0) + 1;

    res.status(201).json({
      success: true,
      message: `Token ${tokenNum} registered! AI Priority: ${triageResult.finalTriagePriority} (${triageResult.aiSeverity})${triageResult.emergencySlot ? ` • Assigned Slot: ${triageResult.emergencySlot}` : ''}. Est. Wait: ${estWaitMins} mins.`,
      token: savedToken ? savedToken.toObject() : memToken,
      triage: triageResult
    });
  } catch (err) {
    console.error('Token registration error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Unable to register OPD token. Please try again.' });
  }
};

app.post('/api/queue/token', handleTokenRegistration);
app.post('/api/tokens', handleTokenRegistration);

// --- AI Triage Live Analysis & Override Endpoints ---
app.post('/api/triage/analyze', (req, res) => {
  const { problemDescription, patientReportedUrgency, painScore, symptomCategory } = req.body;
  const analysis = evaluateTriage(problemDescription, patientReportedUrgency, painScore, symptomCategory);
  res.json({ success: true, triage: analysis });
});

app.get('/api/triage/pending', async (req, res) => {
  try {
    let tokens = [];
    if (isDBConnected()) {
      tokens = await Token.find({ status: 'WAITING' }).sort({ createdAt: -1 }).lean();
    } else {
      tokens = store.queue.filter(q => q.status === 'WAITING');
    }
    res.json({ success: true, triageList: tokens });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching triage tokens.' });
  }
});

app.post('/api/triage/override/:id', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  const { finalTriagePriority, overrideReason, reviewedBy } = req.body;
  const validP = ['P1', 'P2', 'P3', 'P4', 'P5'];
  if (!validP.includes(finalTriagePriority)) {
    return res.status(400).json({ success: false, message: `Invalid priority. Must be one of: ${validP.join(', ')}` });
  }

  try {
    const updateData = {
      finalTriagePriority,
      overrideReason: overrideReason || 'Clinical staff priority review',
      reviewedBy: reviewedBy || req.user?.name || req.user?.email || 'Authorized Staff',
      reviewedAt: new Date(),
      triageStatus: 'OVERRIDDEN',
      priority: finalTriagePriority
    };

    if (isDBConnected()) {
      await Token.updateOne(
        { $or: [{ tokenNumber: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }] },
        { $set: updateData }
      );
    }

    const memToken = store.queue.find(q => q.tokenNumber === req.params.id || q.id === req.params.id);
    if (memToken) {
      Object.assign(memToken, updateData);
    }

    res.json({ success: true, message: `Triage priority updated to ${finalTriagePriority}.`, token: memToken });
  } catch (err) {
    console.error('Triage override error:', err);
    res.status(500).json({ success: false, message: 'Failed to update triage priority.' });
  }
});

// Call Next Patient
app.post('/api/queue/call-next', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  const { doctorId } = req.body;

  try {
    let doc = store.doctors.find(d => d.id === doctorId || d.docId === doctorId || d.name === doctorId) || store.doctors[0];
    let nextInLine = null;

    if (isDBConnected()) {
      // Fetch highest priority WAITING token
      const waitingTokens = await Token.find({ status: 'WAITING' }).sort({ createdAt: 1 }).lean();
      const sorted = waitingTokens.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));

      nextInLine = sorted.find(q => q.doctor === doc.name || q.doctorId === doc.docId || q.doctorId === doc.id) || sorted[0];

      if (nextInLine) {
        await Token.updateOne(
          { _id: nextInLine._id },
          { status: 'IN_CONSULTATION', waitTime: 0, calledAt: new Date(), consultationStartedAt: new Date() }
        );
        await Doctor.updateOne(
          { docId: doc.docId || doc.id },
          { status: 'CONSULTING', currentPatient: `${nextInLine.tokenNumber} (${nextInLine.patientName})`, $inc: { patientsWaiting: -1 } }
        );
      }
    }

    if (!nextInLine) {
      const memWaiting = store.queue.filter(q => q.status === 'WAITING');
      memWaiting.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
      nextInLine = memWaiting.find(q => q.doctor === doc.name || q.doctorId === doc.id) || memWaiting[0];
    }

    if (nextInLine) {
      nextInLine.status = 'IN_CONSULTATION';
      nextInLine.waitTime = 0;
      doc.currentPatient = `${nextInLine.tokenNumber} (${nextInLine.patientName})`;
      doc.patientsWaiting = Math.max(0, (doc.patientsWaiting || 1) - 1);
      doc.status = 'CONSULTING';

      // Update in memory array as well
      const match = store.queue.find(q => q.tokenNumber === nextInLine.tokenNumber);
      if (match) {
        match.status = 'IN_CONSULTATION';
        match.waitTime = 0;
      }

      res.json({
        success: true,
        message: `Calling Token ${nextInLine.tokenNumber} (${nextInLine.patientName}) to ${doc.room || 'OPD Desk'}`,
        calledToken: nextInLine
      });
    } else {
      res.json({
        success: false,
        message: `No waiting patients currently in queue for ${doc.name}.`
      });
    }
  } catch (err) {
    console.error('Call next error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Unable to call next patient.' });
  }
});

// Update Token Status
app.put('/api/queue/:id/status', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
  }

  try {
    let tokenItem = null;

    if (isDBConnected()) {
      tokenItem = await Token.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null },
          { tokenNumber: req.params.id }
        ]
      });

      if (tokenItem) {
        tokenItem.status = status;
        if (status === 'COMPLETED') tokenItem.completedAt = new Date();
        if (status === 'IN_CONSULTATION') tokenItem.consultationStartedAt = new Date();
        await tokenItem.save();

        if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
          await Doctor.updateOne(
            { $or: [{ name: tokenItem.doctor }, { docId: tokenItem.doctorId }] },
            { status: 'AVAILABLE', currentPatient: 'None' }
          );
        }
      }
    }

    const memItem = store.queue.find(q => q.id === req.params.id || q.tokenNumber === req.params.id);
    if (memItem) {
      memItem.status = status;
      if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
        const doc = store.doctors.find(d => d.name === memItem.doctor || d.id === memItem.doctorId);
        if (doc) {
          doc.status = 'AVAILABLE';
          doc.currentPatient = 'None';
        }
      }
    }

    if (tokenItem || memItem) {
      res.json({
        success: true,
        message: `Token status marked as ${status}`,
        token: tokenItem ? tokenItem.toObject() : memItem
      });
    } else {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Token item not found.' });
    }
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to update token status.' });
  }
});

// ==============================================================================
// 6. DOCTOR ROSTER MANAGEMENT
// ==============================================================================

app.get('/api/doctors', async (req, res) => {
  try {
    if (isDBConnected()) {
      const docList = await Doctor.find().lean();
      if (docList.length > 0) return res.json({ success: true, doctors: docList });
    }
    res.json({ success: true, doctors: store.doctors });
  } catch (err) {
    res.json({ success: true, doctors: store.doctors });
  }
});

app.post('/api/doctors', requireRoles(['Admin']), async (req, res) => {
  const { name, email, specialization, department, room, phone } = req.body;

  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Doctor Name and Email are required.' });
  }

  try {
    const docCount = isDBConnected() ? await Doctor.countDocuments() : store.doctors.length;
    const docId = `doc-${docCount + 1}`;

    const newDocData = {
      docId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      specialization: specialization || 'General Physician',
      department: department || 'General Medicine',
      room: room || 'OPD Room #105',
      phone: phone || '+91 98765 00000',
      status: 'AVAILABLE',
      patientsWaiting: 0,
      currentPatient: 'None'
    };

    let savedDoc = null;

    if (isDBConnected()) {
      const docModel = new Doctor(newDocData);
      savedDoc = await docModel.save();

      const userModel = new User({
        name: newDocData.name,
        role: 'Doctor',
        email: newDocData.email,
        department: newDocData.department
      });
      await userModel.save();
    }

    const memDoc = { id: docId, ...newDocData };
    store.doctors.push(memDoc);
    store.users.push({ id: `usr-${docId}`, name: memDoc.name, role: 'Doctor', email: memDoc.email, department: memDoc.department });

    res.status(201).json({
      success: true,
      message: `Doctor ${newDocData.name} registered and login created.`,
      doctor: savedDoc ? savedDoc.toObject() : memDoc
    });
  } catch (err) {
    console.error('Add doctor error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Error adding doctor.' });
  }
});

app.put('/api/doctors/:id', requireRoles(['Admin']), async (req, res) => {
  const { name, email, specialization, department, room, phone } = req.body;

  try {
    if (isDBConnected()) {
      await Doctor.updateOne(
        { $or: [{ docId: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }] },
        { name, email, specialization, department, room, phone }
      );
    }

    const memDoc = store.doctors.find(d => d.id === req.params.id || d.docId === req.params.id);
    if (memDoc) {
      if (name) memDoc.name = name;
      if (email) memDoc.email = email;
      if (specialization) memDoc.specialization = specialization;
      if (department) memDoc.department = department;
      if (room) memDoc.room = room;
      if (phone) memDoc.phone = phone;
    }

    res.json({ success: true, message: 'Doctor profile updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating doctor.' });
  }
});

app.delete('/api/doctors/:id', requireRoles(['Admin']), async (req, res) => {
  try {
    if (isDBConnected()) {
      await Doctor.deleteOne({ $or: [{ docId: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }] });
    }

    const idx = store.doctors.findIndex(d => d.id === req.params.id || d.docId === req.params.id);
    if (idx !== -1) {
      store.doctors.splice(idx, 1);
    }

    res.json({ success: true, message: 'Doctor removed from roster.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting doctor.' });
  }
});

app.put('/api/doctors/:id/status', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  const { status } = req.body;
  const validDocStatuses = ['AVAILABLE', 'CONSULTING', 'ON_BREAK', 'OFFLINE'];

  if (!validDocStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: `Invalid status. Allowed: ${validDocStatuses.join(', ')}` });
  }

  try {
    if (isDBConnected()) {
      await Doctor.updateOne(
        { $or: [{ docId: req.params.id }, { name: req.params.id }] },
        { status }
      );
    }

    const memDoc = store.doctors.find(d => d.id === req.params.id || d.docId === req.params.id || d.name === req.params.id);
    if (memDoc) memDoc.status = status;

    res.json({ success: true, message: `Doctor status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating doctor status.' });
  }
});

// ==============================================================================
// 7. BED MANAGEMENT, ADMISSIONS & SMART RECOMMENDATIONS
// ==============================================================================

app.get('/api/beds', async (req, res) => {
  try {
    if (isDBConnected()) {
      const beds = await Bed.find().lean();
      if (beds.length > 0) return res.json({ success: true, beds });
    }
    res.json({ success: true, beds: store.beds });
  } catch (err) {
    res.json({ success: true, beds: store.beds });
  }
});

app.post('/api/admissions/recommend-bed', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  const { ward, requireVentilator, requireOxygen, requireIsolation } = req.body;

  try {
    let availableBeds = [];

    if (isDBConnected()) {
      const query = { status: 'AVAILABLE' };
      if (ward && ward !== 'all') query.ward = new RegExp(`^${ward}$`, 'i');
      if (requireVentilator) query.hasVentilator = true;
      if (requireOxygen) query.hasOxygen = true;
      if (requireIsolation) query.isIsolation = true;

      availableBeds = await Bed.find(query).limit(5).lean();
    }

    if (availableBeds.length === 0) {
      let candidates = store.beds.filter(b => b.status === 'AVAILABLE');
      if (ward && ward !== 'all') candidates = candidates.filter(b => b.ward.toLowerCase() === ward.toLowerCase());
      if (requireVentilator) candidates = candidates.filter(b => b.hasVentilator === true);
      if (requireOxygen) candidates = candidates.filter(b => b.hasOxygen === true);
      if (requireIsolation) candidates = candidates.filter(b => b.isIsolation === true);
      availableBeds = candidates.slice(0, 5);
    }

    if (availableBeds.length > 0) {
      res.json({
        success: true,
        count: availableBeds.length,
        recommendations: availableBeds.map(b => ({
          id: b._id ? b._id.toString() : b.id,
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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error calculating recommendations.' });
  }
});

app.put('/api/beds/:id/admit', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  const { patientName, doctor, diagnosis } = req.body;

  try {
    const admNumber = `ADM-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const admDate = new Date().toISOString().split('T')[0];

    if (isDBConnected()) {
      const bed = await Bed.findOne({ $or: [{ bedId: req.params.id }, { bedNumber: req.params.id }] });
      if (!bed) return res.status(404).json({ success: false, message: 'Bed not found' });
      if (bed.status === 'OCCUPIED') return res.status(409).json({ success: false, message: 'Bed is already occupied' });

      bed.status = 'OCCUPIED';
      bed.patient = patientName || 'Admitted Inpatient';
      bed.doctor = doctor || 'Dr. Sunita Rao';
      bed.admissionDate = admDate;
      await bed.save();

      const newAdm = new Admission({
        admNumber,
        patient: bed.patient,
        ward: bed.ward,
        bedNumber: bed.bedNumber,
        doctor: bed.doctor,
        diagnosis: diagnosis || 'Clinical Inpatient Observation',
        admissionDate: admDate,
        status: 'Admitted'
      });
      await newAdm.save();
    }

    const memBed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id || b.bedId === req.params.id);
    if (memBed) {
      memBed.status = 'OCCUPIED';
      memBed.patient = patientName || 'Admitted Inpatient';
      memBed.doctor = doctor || 'Dr. Sunita Rao';
      memBed.admissionDate = admDate;

      store.admissions.unshift({
        admNumber,
        patient: memBed.patient,
        ward: memBed.ward,
        bedNumber: memBed.bedNumber,
        doctor: memBed.doctor,
        diagnosis: diagnosis || 'Clinical Inpatient',
        admissionDate: admDate,
        status: 'Admitted'
      });
    }

    res.json({ success: true, message: `Patient admitted to bed successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error admitting patient.' });
  }
});

app.put('/api/beds/:id/discharge', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  try {
    const dDate = new Date().toISOString().split('T')[0];

    if (isDBConnected()) {
      const bed = await Bed.findOne({ $or: [{ bedId: req.params.id }, { bedNumber: req.params.id }] });
      if (bed) {
        const pt = bed.patient;
        bed.status = 'AVAILABLE';
        bed.patient = null;
        bed.doctor = null;
        bed.admissionDate = null;
        await bed.save();

        await Admission.updateOne({ bedNumber: bed.bedNumber, status: 'Admitted' }, { status: 'Discharged', dischargeDate: dDate });
      }
    }

    const memBed = store.beds.find(b => b.id === req.params.id || b.bedNumber === req.params.id || b.bedId === req.params.id);
    if (memBed) {
      memBed.status = 'AVAILABLE';
      memBed.patient = null;
      memBed.doctor = null;
      memBed.admissionDate = null;

      const adm = store.admissions.find(a => a.bedNumber === memBed.bedNumber && a.status === 'Admitted');
      if (adm) {
        adm.status = 'Discharged';
        adm.dischargeDate = dDate;
      }
    }

    res.json({ success: true, message: 'Patient discharged. Bed is now Available.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error discharging patient.' });
  }
});

app.get('/api/admissions', async (req, res) => {
  try {
    if (isDBConnected()) {
      const adms = await Admission.find().sort({ createdAt: -1 }).lean();
      if (adms.length > 0) return res.json({ success: true, admissions: adms });
    }
    res.json({ success: true, admissions: store.admissions });
  } catch (err) {
    res.json({ success: true, admissions: store.admissions });
  }
});

// ==============================================================================
// 8. EMERGENCY SIREN & OPERATIONAL INSIGHTS & ALERTS
// ==============================================================================

app.post('/api/emergency/siren', requireRoles(['Doctor', 'Admin']), async (req, res) => {
  try {
    const alertData = {
      severity: 'CRITICAL',
      title: '🚨 EMERGENCY SIREN ACTIVATED',
      message: `Emergency siren triggered by ${req.user?.name || 'Staff'} at ${new Date().toLocaleTimeString()}. All available personnel respond immediately.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triggeredBy: req.user?.name || 'Unknown',
      triggeredAt: new Date()
    };

    if (isDBConnected()) {
      const newAlert = new Alert(alertData);
      await newAlert.save();
    }

    store.alerts.unshift(alertData);

    res.json({
      success: true,
      message: 'Emergency siren activated! All departments notified.',
      alert: alertData
    });
  } catch (err) {
    console.error('Emergency siren error:', err);
    res.status(500).json({ success: false, message: 'Error activating emergency siren.' });
  }
});


app.get('/api/insights', async (req, res) => {
  try {
    let bedList = store.beds;
    let queueList = store.queue;
    let doctorList = store.doctors;

    if (isDBConnected()) {
      bedList = await Bed.find().lean();
      queueList = await Token.find().lean();
      doctorList = await Doctor.find().lean();
    }

    const icuTotal = bedList.filter(b => b.ward === 'ICU').length || 15;
    const icuOccupied = bedList.filter(b => b.ward === 'ICU' && b.status === 'OCCUPIED').length;
    const icuOccPercent = icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 0;

    const waitingQueue = queueList.filter(q => q.status === 'WAITING');
    const dynamicInsights = [];
    const dynamicAlerts = [];

    // 1. Department Load Analytics
    const deptCounts = {};
    waitingQueue.forEach(q => {
      deptCounts[q.department] = (deptCounts[q.department] || 0) + 1;
    });

    let highestDept = null;
    let maxWaiting = 0;
    for (const [dept, count] of Object.entries(deptCounts)) {
      if (count > maxWaiting) {
        maxWaiting = count;
        highestDept = dept;
      }
    }

    if (highestDept && maxWaiting >= 2) {
      dynamicInsights.push({
        id: 'ins-surge',
        category: 'Queue Surge AI',
        text: `${highestDept} OPD is currently experiencing high patient influx (${maxWaiting} waiting). Recommend dispatching Dr. Vikramaditya Roy or Dr. Vikram Malhotra to assist Room #104.`,
        priority: maxWaiting >= 4 ? 'critical' : 'high',
        icon: 'trending-up'
      });
    }

    // 2. ICU & Emergency Life Support Readiness
    const icuVacant = icuTotal - icuOccupied;
    const icuVentilators = bedList.filter(b => b.ward === 'ICU' && b.status === 'AVAILABLE' && b.hasVentilator).length;

    if (icuOccPercent >= 75) {
      dynamicInsights.push({
        id: 'ins-icu',
        category: 'Bed Optimization',
        text: `ICU Ward capacity reached ${icuOccPercent}%. ${icuVentilators} ventilator-ready ICU bed(s) available. Prioritize general ward transfers for stable recovery patients.`,
        priority: 'critical',
        icon: 'alert-triangle'
      });
      dynamicAlerts.push({
        id: 'alt-icu',
        severity: 'CRITICAL',
        title: '🛏️ High ICU Occupancy Alert',
        message: `ICU occupancy is at ${icuOccPercent}%. Only ${icuVacant} vacant ICU beds remain available for incoming trauma triage.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      dynamicInsights.push({
        id: 'ins-bed-optimal',
        category: 'Bed Telemetry',
        text: `Critical Care capacity is healthy. ${icuVacant} ICU beds (${icuVentilators} ventilator-equipped) and ${bedList.filter(b => b.ward === 'Emergency' && b.status === 'AVAILABLE').length} ER bays open for trauma intake.`,
        priority: 'normal',
        icon: 'shield-check'
      });
    }

    // 3. Physician Resource Balancing
    const availableDocs = doctorList.filter(d => d.status === 'AVAILABLE').length;
    const consultingDocs = doctorList.filter(d => d.status === 'CONSULTING').length;
    dynamicInsights.push({
      id: 'ins-physician',
      category: 'Physician Roster',
      text: `${consultingDocs} doctors actively consulting with patients, ${availableDocs} physicians ready for instant assignment. OPD average cycle time is optimal at ~14 minutes.`,
      priority: 'normal',
      icon: 'user-check'
    });

    // 4. Emergency Cases Alert
    const emgCount = queueList.filter(q => q.priority === 'Emergency' && q.status !== 'COMPLETED').length;
    if (emgCount > 0) {
      dynamicAlerts.push({
        id: 'alt-emg',
        severity: 'CRITICAL',
        title: '🚨 Emergency Triage Active',
        message: `${emgCount} active emergency case receiving immediate resuscitation in ER Bay.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      dynamicAlerts.push({
        id: 'alt-status',
        severity: 'INFO',
        title: 'ℹ️ Hospital Network Nominal',
        message: 'All department queue telemetry and bed reservation interfaces are operating within normal SLA limits.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    res.json({
      success: true,
      insights: dynamicInsights,
      alerts: dynamicAlerts
    });
  } catch (err) {
    res.json({ success: true, insights: [], alerts: [] });
  }
});

app.get('/api/departments', (req, res) => res.json({ success: true, departments: store.departments }));

app.get('/api/patients', async (req, res) => {
  try {
    if (isDBConnected()) {
      const pts = await Token.find().sort({ createdAt: -1 }).lean();
      if (pts.length > 0) return res.json({ success: true, patients: pts });
    }
    res.json({ success: true, patients: store.queue });
  } catch (err) {
    res.json({ success: true, patients: store.queue });
  }
});

// SPA Wildcard Route
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
  🏥 Connected to MongoDB Atlas & Real-Time Sync
  🏥 =======================================================
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${currentPort} in use. Retrying on ${currentPort + 1}...`);
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
