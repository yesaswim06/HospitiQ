const mongoose = require('mongoose');
const crypto = require('crypto');

// Models
const Token = require('./models/Token');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Admission = require('./models/Admission');
const User = require('./models/User');
const Alert = require('./models/Alert');

const MONGODB_URI = process.env.MONGODB_URI || '';

const generateSecureTokenKey = () => crypto.randomBytes(8).toString('hex');

// In-Memory Fallback Cache Store
const memoryStore = {
  users: [
    { id: 'usr-adm-1', name: 'Dr. Vikramaditya Roy', role: 'Admin', email: 'admin@hospitiq.org', department: 'Administration' },
    { id: 'usr-doc-1', name: 'Dr. Sunita Rao', role: 'Doctor', email: 'doctor@hospitiq.org', department: 'Cardiology' },
    { id: 'usr-doc-2', name: 'Dr. Vikram Malhotra', role: 'Doctor', email: 'vikram@hospitiq.org', department: 'General Medicine' },
    { id: 'usr-doc-3', name: 'Dr. Ananya Reddy', role: 'Doctor', email: 'ananya@hospitiq.org', department: 'Orthopedics' },
    { id: 'usr-doc-4', name: 'Dr. Hrishikesh Deshmukh', role: 'Doctor', email: 'hrishi@hospitiq.org', department: 'Pediatrics' },
    { id: 'usr-doc-5', name: 'Dr. Priya Patel', role: 'Doctor', email: 'priya@hospitiq.org', department: 'Neurology' },
    { id: 'usr-doc-6', name: 'Dr. Suresh Menon', role: 'Doctor', email: 'suresh@hospitiq.org', department: 'Dermatology' },
    { id: 'usr-doc-7', name: 'Dr. Meera Nambiar', role: 'Doctor', email: 'meera@hospitiq.org', department: 'ENT' },
    { id: 'usr-pt-1', name: 'Ramesh Verma', role: 'Patient', email: 'patient@hospitiq.org', tokenNumber: 'A-024' }
  ],
  queue: [
    { id: 'q-101', secToken: 'sec_7f9a21e4', tokenNumber: 'A-024', patientName: 'Ramesh Verma', age: 44, gender: 'Male', phone: '+91 99000 11223', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 0, patientsAhead: 0, room: 'OPD Room #104', priority: 'High', status: 'IN_CONSULTATION', registrationTime: '09:45 AM', timestamp: Date.now() - 3600000, smsSent: true },
    { id: 'q-102', secToken: 'sec_8c3b44f1', tokenNumber: 'A-031', patientName: 'Priya Sundaram', age: 32, gender: 'Female', phone: '+91 98765 43210', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 24, patientsAhead: 2, room: 'OPD Room #104', priority: 'Normal', status: 'WAITING', registrationTime: '10:15 AM', timestamp: Date.now() - 2700000, smsSent: true },
    { id: 'q-103', secToken: 'sec_9a1d55c2', tokenNumber: 'B-012', patientName: 'Amitabh Sen', age: 58, gender: 'Male', phone: '+91 91234 56789', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 12, patientsAhead: 1, room: 'OPD Room #108', priority: 'Normal', status: 'WAITING', registrationTime: '10:20 AM', timestamp: Date.now() - 2400000, smsSent: true },
    { id: 'q-104', secToken: 'sec_5e2c99a8', tokenNumber: 'EM-501', patientName: 'Sanjay Dutt', age: 50, gender: 'Male', phone: '+91 91100 00911', department: 'Emergency', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 0, patientsAhead: 0, room: 'ER Bay #01', priority: 'Emergency', status: 'IN_CONSULTATION', registrationTime: '10:30 AM', timestamp: Date.now() - 1800000, smsSent: true },
    { id: 'q-105', secToken: 'sec_2f8b11d9', tokenNumber: 'P-008', patientName: 'Kavita Krishnan', age: 27, gender: 'Female', phone: '+91 98765 11122', department: 'Pediatrics', doctor: 'Dr. Hrishikesh Deshmukh', doctorId: 'doc-4', waitTime: 12, patientsAhead: 1, room: 'OPD Room #105', priority: 'Normal', status: 'WAITING', registrationTime: '10:35 AM', timestamp: Date.now() - 1500000, smsSent: true },
    { id: 'q-106', secToken: 'sec_3a7c44e0', tokenNumber: 'O-019', patientName: 'Deepak Nair', age: 39, gender: 'Male', phone: '+91 98765 22233', department: 'Orthopedics', doctor: 'Dr. Ananya Reddy', doctorId: 'doc-3', waitTime: 15, patientsAhead: 1, room: 'OPD Room #201', priority: 'High', status: 'WAITING', registrationTime: '10:40 AM', timestamp: Date.now() - 1200000, smsSent: true },
    { id: 'q-107', secToken: 'sec_4b6e55f3', tokenNumber: 'N-005', patientName: 'Sunil Gavaskar', age: 62, gender: 'Male', phone: '+91 98765 33344', department: 'Neurology', doctor: 'Dr. Priya Patel', doctorId: 'doc-5', waitTime: 15, patientsAhead: 1, room: 'OPD Room #304', priority: 'Normal', status: 'WAITING', registrationTime: '10:45 AM', timestamp: Date.now() - 900000, smsSent: true },
    { id: 'q-108', secToken: 'sec_6d1a88b5', tokenNumber: 'D-014', patientName: 'Ayesha Takia', age: 29, gender: 'Female', phone: '+91 98765 44455', department: 'Dermatology', doctor: 'Dr. Suresh Menon', doctorId: 'doc-6', waitTime: 10, patientsAhead: 1, room: 'OPD Room #110', priority: 'Normal', status: 'WAITING', registrationTime: '10:50 AM', timestamp: Date.now() - 600000, smsSent: true },
    { id: 'q-109', secToken: 'sec_7e3f99c6', tokenNumber: 'E-007', patientName: 'Rohan Bopanna', age: 41, gender: 'Male', phone: '+91 98765 55566', department: 'ENT', doctor: 'Dr. Meera Nambiar', doctorId: 'doc-7', waitTime: 18, patientsAhead: 1, room: 'OPD Room #115', priority: 'Normal', status: 'WAITING', registrationTime: '10:55 AM', timestamp: Date.now() - 300000, smsSent: true },
    { id: 'q-110', secToken: 'sec_8f4a00d7', tokenNumber: 'B-018', patientName: 'Sneha Roy', age: 35, gender: 'Female', phone: '+91 98765 66677', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 24, patientsAhead: 2, room: 'OPD Room #108', priority: 'Normal', status: 'WAITING', registrationTime: '11:00 AM', timestamp: Date.now() - 60000, smsSent: true }
  ],
  doctors: [
    { docId: 'doc-1', id: 'doc-1', name: 'Dr. Sunita Rao', specialization: 'Interventional Cardiology', department: 'Cardiology', status: 'CONSULTING', patientsWaiting: 1, currentPatient: 'A-024 (Ramesh Verma)', room: 'OPD Room #104', phone: '+91 98111 22233', email: 'doctor@hospitiq.org' },
    { docId: 'doc-2', id: 'doc-2', name: 'Dr. Vikram Malhotra', specialization: 'Internal Medicine', department: 'General Medicine', status: 'AVAILABLE', patientsWaiting: 2, currentPatient: 'None', room: 'OPD Room #108', phone: '+91 98222 33344', email: 'vikram@hospitiq.org' },
    { docId: 'doc-3', id: 'doc-3', name: 'Dr. Ananya Reddy', specialization: 'Orthopedic Surgery', department: 'Orthopedics', status: 'AVAILABLE', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #201', phone: '+91 98333 44455', email: 'ananya@hospitiq.org' },
    { docId: 'doc-4', id: 'doc-4', name: 'Dr. Hrishikesh Deshmukh', specialization: 'Pediatric Care & Child Health', department: 'Pediatrics', status: 'AVAILABLE', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #105', phone: '+91 98444 55566', email: 'hrishi@hospitiq.org' },
    { docId: 'doc-5', id: 'doc-5', name: 'Dr. Priya Patel', specialization: 'Neurology & Stroke Triage', department: 'Neurology', status: 'AVAILABLE', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #304', phone: '+91 98555 66677', email: 'priya@hospitiq.org' },
    { docId: 'doc-6', id: 'doc-6', name: 'Dr. Suresh Menon', specialization: 'Clinical Dermatology', department: 'Dermatology', status: 'AVAILABLE', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #110', phone: '+91 98666 77788', email: 'suresh@hospitiq.org' },
    { docId: 'doc-7', id: 'doc-7', name: 'Dr. Meera Nambiar', specialization: 'Otolaryngology (ENT)', department: 'ENT', status: 'AVAILABLE', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #115', phone: '+91 98777 88899', email: 'meera@hospitiq.org' },
    { docId: 'doc-8', id: 'doc-8', name: 'Dr. Vikramaditya Roy', specialization: 'Cardiac Electrophysiology', department: 'Cardiology', status: 'AVAILABLE', patientsWaiting: 0, currentPatient: 'None', room: 'OPD Room #102', phone: '+91 98888 99900', email: 'admin@hospitiq.org' }
  ],
  beds: Array.from({ length: 100 }, (_, i) => {
    const bedId = i + 1;
    let ward = 'General Ward';
    if (bedId <= 15) ward = 'ICU';
    else if (bedId <= 30) ward = 'Emergency';
    else if (bedId <= 60) ward = 'General Ward';
    else if (bedId <= 75) ward = 'Private Ward';
    else if (bedId <= 85) ward = 'Semi-Private';
    else if (bedId <= 93) ward = 'Pediatric';
    else ward = 'Maternity';

    let status = 'AVAILABLE';
    if (bedId === 12 || bedId === 44) {
      status = 'MAINTENANCE';
    } else if (bedId === 15 || bedId === 75) {
      status = 'RESERVED';
    } else if (bedId <= 68 || bedId === 72 || bedId === 80) {
      status = 'OCCUPIED';
    } else {
      status = 'AVAILABLE';
    }

    return {
      id: `bed-${bedId}`,
      bedId: `bed-${bedId}`,
      bedNumber: `BED-${String(bedId).padStart(3, '0')}`,
      ward,
      status,
      patient: status === 'OCCUPIED' ? (bedId === 1 ? 'Ramesh Verma' : `Patient #${bedId + 100}`) : null,
      doctor: status === 'OCCUPIED' ? (ward === 'ICU' ? 'Dr. Sunita Rao' : 'Dr. Vikram Malhotra') : null,
      admissionDate: status === 'OCCUPIED' ? '2026-08-19' : null,
      hasVentilator: ward === 'ICU' || bedId <= 5,
      hasOxygen: true,
      isIsolation: ward === 'ICU' && (bedId === 1 || bedId === 2)
    };
  }),
  departments: [
    { id: 'dept-1', name: 'Cardiology', currentQueue: 2, avgWaitMins: 20, doctorsAvailable: 2, status: 'Normal' },
    { id: 'dept-2', name: 'General Medicine', currentQueue: 3, avgWaitMins: 15, doctorsAvailable: 1, status: 'Busy' },
    { id: 'dept-3', name: 'Emergency', currentQueue: 1, avgWaitMins: 0, doctorsAvailable: 1, status: 'Critical' },
    { id: 'dept-4', name: 'Pediatrics', currentQueue: 1, avgWaitMins: 12, doctorsAvailable: 1, status: 'Normal' },
    { id: 'dept-5', name: 'Orthopedics', currentQueue: 1, avgWaitMins: 20, doctorsAvailable: 1, status: 'Normal' },
    { id: 'dept-6', name: 'Neurology', currentQueue: 1, avgWaitMins: 15, doctorsAvailable: 1, status: 'Normal' },
    { id: 'dept-7', name: 'Dermatology', currentQueue: 1, avgWaitMins: 10, doctorsAvailable: 1, status: 'Normal' },
    { id: 'dept-8', name: 'ENT', currentQueue: 1, avgWaitMins: 18, doctorsAvailable: 1, status: 'Normal' }
  ],
  admissions: [
    { admNumber: 'ADM-101', patient: 'Ramesh Verma', ward: 'ICU', bedNumber: 'BED-001', doctor: 'Dr. Sunita Rao', diagnosis: 'Acute Coronary Syndrome', admissionDate: '2026-08-19', status: 'Admitted' },
    { admNumber: 'ADM-102', patient: 'Kiran Sharma', ward: 'Emergency', bedNumber: 'BED-016', doctor: 'Dr. Vikram Malhotra', diagnosis: 'High Fever & Trauma Triage', admissionDate: '2026-08-19', status: 'Admitted' },
    { admNumber: 'ADM-103', patient: 'Deepak Nair', ward: 'General Ward', bedNumber: 'BED-031', doctor: 'Dr. Ananya Reddy', diagnosis: 'Orthopedic Fracture Stabilization', admissionDate: '2026-08-18', status: 'Admitted' },
    { admNumber: 'ADM-104', patient: 'Sunil Gavaskar', ward: 'Private Ward', bedNumber: 'BED-061', doctor: 'Dr. Priya Patel', diagnosis: 'Neurological Observation', admissionDate: '2026-08-18', status: 'Admitted' }
  ],
  insights: [],
  alerts: []
};

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  if (!MONGODB_URI) {
    console.info('ℹ️  Running in high-performance in-memory dataset mode.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log('✅ MongoDB Atlas connected successfully for HOSPITIQ.');

    // Auto-seed if collections are empty
    const tokenCount = await Token.countDocuments();
    if (tokenCount === 0) {
      console.log('ℹ️  Auto-initializing MongoDB Atlas collections with seed data...');
      await Doctor.insertMany(memoryStore.doctors.map(d => ({ ...d, docId: d.id })));
      await User.insertMany(memoryStore.users);
      await Bed.insertMany(memoryStore.beds);
      await Admission.insertMany(memoryStore.admissions);
      await Token.insertMany(memoryStore.queue);
      console.log('✅ MongoDB Atlas collections initialized.');
    }
  } catch (err) {
    isConnected = false;
    console.warn('ℹ️  MongoDB Atlas connection deferred. Running in-memory store mode.');
  }
};

const isDBConnected = () => isConnected && mongoose.connection.readyState === 1;

const getStore = () => memoryStore;

module.exports = {
  connectDB,
  isDBConnected,
  getStore,
  generateSecureTokenKey,
  models: {
    Token,
    Patient,
    Doctor,
    Bed,
    Admission,
    User,
    Alert
  }
};
