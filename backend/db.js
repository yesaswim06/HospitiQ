const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://tarunkumarn999_db_user:yQrv08IV1xbStmHo@cluster0.mongodb.net/hospitiq?retryWrites=true&w=majority";

// HOSPITIQ High Performance Rich Dataset (8 Doctors, 10 Patients, 100 Beds)
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
    { id: 'q-101', tokenNumber: 'A-024', patientName: 'Ramesh Verma', age: 44, gender: 'Male', phone: '+91 99000 11223', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 0, patientsAhead: 0, room: 'OPD Room #104', priority: 'High', status: 'In Consultation', registrationTime: '09:45 AM', smsSent: true },
    { id: 'q-102', tokenNumber: 'A-031', patientName: 'Priya Sundaram', age: 32, gender: 'Female', phone: '+91 98765 43210', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 28, patientsAhead: 3, room: 'OPD Room #104', priority: 'Normal', status: 'Waiting', registrationTime: '10:15 AM', smsSent: true },
    { id: 'q-103', tokenNumber: 'B-012', patientName: 'Amitabh Sen', age: 58, gender: 'Male', phone: '+91 91234 56789', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 14, patientsAhead: 1, room: 'OPD Room #108', priority: 'Normal', status: 'Waiting', registrationTime: '10:20 AM', smsSent: true },
    { id: 'q-104', tokenNumber: 'EM-501', patientName: 'Sanjay Dutt', age: 50, gender: 'Male', phone: '+91 91100 00911', department: 'Emergency', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 0, patientsAhead: 0, room: 'ER Bay #01', priority: 'Emergency', status: 'In Consultation', registrationTime: '10:30 AM', smsSent: true },
    { id: 'q-105', tokenNumber: 'P-008', patientName: 'Kavita Krishnan', age: 27, gender: 'Female', phone: '+91 98765 11122', department: 'Pediatrics', doctor: 'Dr. Hrishikesh Deshmukh', doctorId: 'doc-4', waitTime: 12, patientsAhead: 1, room: 'OPD Room #105', priority: 'Normal', status: 'Waiting', registrationTime: '10:35 AM', smsSent: true },
    { id: 'q-106', tokenNumber: 'O-019', patientName: 'Deepak Nair', age: 39, gender: 'Male', phone: '+91 98765 22233', department: 'Orthopedics', doctor: 'Dr. Ananya Reddy', doctorId: 'doc-3', waitTime: 20, patientsAhead: 2, room: 'OPD Room #201', priority: 'High', status: 'Waiting', registrationTime: '10:40 AM', smsSent: true },
    { id: 'q-107', tokenNumber: 'N-005', patientName: 'Sunil Gavaskar', age: 62, gender: 'Male', phone: '+91 98765 33344', department: 'Neurology', doctor: 'Dr. Priya Patel', doctorId: 'doc-5', waitTime: 15, patientsAhead: 1, room: 'OPD Room #304', priority: 'Normal', status: 'Waiting', registrationTime: '10:45 AM', smsSent: true },
    { id: 'q-108', tokenNumber: 'D-014', patientName: 'Ayesha Takia', age: 29, gender: 'Female', phone: '+91 98765 44455', department: 'Dermatology', doctor: 'Dr. Suresh Menon', doctorId: 'doc-6', waitTime: 10, patientsAhead: 1, room: 'OPD Room #110', priority: 'Normal', status: 'Waiting', registrationTime: '10:50 AM', smsSent: true },
    { id: 'q-109', tokenNumber: 'E-007', patientName: 'Rohan Bopanna', age: 41, gender: 'Male', phone: '+91 98765 55566', department: 'ENT', doctor: 'Dr. Meera Nambiar', doctorId: 'doc-7', waitTime: 18, patientsAhead: 2, room: 'OPD Room #115', priority: 'Normal', status: 'Waiting', registrationTime: '10:55 AM', smsSent: true },
    { id: 'q-110', tokenNumber: 'B-018', patientName: 'Sneha Roy', age: 35, gender: 'Female', phone: '+91 98765 66677', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 32, patientsAhead: 3, room: 'OPD Room #108', priority: 'Normal', status: 'Waiting', registrationTime: '11:00 AM', smsSent: true }
  ],
  doctors: [
    { id: 'doc-1', name: 'Dr. Sunita Rao', specialization: 'Interventional Cardiology', department: 'Cardiology', status: 'Busy', patientsWaiting: 2, currentPatient: 'A-024 (Ramesh Verma)', room: 'OPD Room #104', phone: '+91 98111 22233', email: 'doctor@hospitiq.org' },
    { id: 'doc-2', name: 'Dr. Vikram Malhotra', specialization: 'Internal Medicine', department: 'General Medicine', status: 'Available', patientsWaiting: 2, currentPatient: 'EM-501 (Sanjay Dutt)', room: 'OPD Room #108', phone: '+91 98222 33344', email: 'vikram@hospitiq.org' },
    { id: 'doc-3', name: 'Dr. Ananya Reddy', specialization: 'Orthopedic Surgery', department: 'Orthopedics', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #201', phone: '+91 98333 44455', email: 'ananya@hospitiq.org' },
    { id: 'doc-4', name: 'Dr. Hrishikesh Deshmukh', specialization: 'Pediatric Care & Child Health', department: 'Pediatrics', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #105', phone: '+91 98444 55566', email: 'hrishi@hospitiq.org' },
    { id: 'doc-5', name: 'Dr. Priya Patel', specialization: 'Neurology & Stroke Triage', department: 'Neurology', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #304', phone: '+91 98555 66677', email: 'priya@hospitiq.org' },
    { id: 'doc-6', name: 'Dr. Suresh Menon', specialization: 'Clinical Dermatology', department: 'Dermatology', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #110', phone: '+91 98666 77788', email: 'suresh@hospitiq.org' },
    { id: 'doc-7', name: 'Dr. Meera Nambiar', specialization: 'Otolaryngology (ENT)', department: 'ENT', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #115', phone: '+91 98777 88899', email: 'meera@hospitiq.org' },
    { id: 'doc-8', name: 'Dr. Vikramaditya Roy', specialization: 'Cardiac Electrophysiology', department: 'Cardiology', status: 'Available', patientsWaiting: 0, currentPatient: 'None', room: 'OPD Room #102', phone: '+91 98888 99900', email: 'admin@hospitiq.org' }
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

    const isOccupied = (bedId % 3 === 0) || bedId === 1 || bedId === 7;
    const isCleaning = bedId === 12 || bedId === 44;
    const status = isCleaning ? 'Cleaning' : (isOccupied ? 'Occupied' : 'Available');

    return {
      id: `bed-${bedId}`,
      bedNumber: `BED-${String(bedId).padStart(3, '0')}`,
      ward,
      status,
      patient: status === 'Occupied' ? (bedId === 1 ? 'Ramesh Verma' : `Patient #${bedId + 100}`) : null,
      doctor: status === 'Occupied' ? 'Dr. Sunita Rao' : null,
      admissionDate: status === 'Occupied' ? '2026-08-19' : null,
      hasVentilator: ward === 'ICU' || bedId <= 5,
      hasOxygen: true
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
    { id: 'adm-101', patient: 'Ramesh Verma', ward: 'ICU', bedNumber: 'BED-001', doctor: 'Dr. Sunita Rao', diagnosis: 'Acute Coronary Syndrome', admissionDate: '2026-08-19', status: 'Admitted' },
    { id: 'adm-102', patient: 'Kiran Sharma', ward: 'Emergency', bedNumber: 'BED-016', doctor: 'Dr. Vikram Malhotra', diagnosis: 'High Fever & Trauma Triage', admissionDate: '2026-08-19', status: 'Admitted' },
    { id: 'adm-103', patient: 'Deepak Nair', ward: 'General Ward', bedNumber: 'BED-031', doctor: 'Dr. Ananya Reddy', diagnosis: 'Orthopedic Fracture Stabilization', admissionDate: '2026-08-18', status: 'Admitted' },
    { id: 'adm-104', patient: 'Sunil Gavaskar', ward: 'Private Ward', bedNumber: 'BED-061', doctor: 'Dr. Priya Patel', diagnosis: 'Neurological Observation', admissionDate: '2026-08-18', status: 'Admitted' }
  ],
  insights: [
    { id: 'ins-1', category: 'Queue Surge', text: 'OPD Cardiology Queue surge (+32%) detected between 10:00 AM - 11:30 AM.', priority: 'high', icon: 'trending-up' },
    { id: 'ins-2', category: 'Bed Matrix', text: 'ICU Ward at 80% capacity. Recommended reserving 3 emergency reserve beds.', priority: 'critical', icon: 'alert-triangle' },
    { id: 'ins-3', category: 'Doctor Dispatch', text: 'Dr. Vikram Malhotra consultation throughput is optimal (12 mins / patient).', priority: 'normal', icon: 'check-circle' }
  ],
  alerts: [
    { id: 'alt-1', title: '🚨 Emergency Triage Token EM-501 Dispatched', message: 'Assigned immediately to ER Bay #01 under Dr. Vikram Malhotra.', time: '10:30 AM', resolved: false },
    { id: 'alt-2', title: '🛏️ ICU Ward Capacity Threshold Warning', message: 'ICU bed occupancy has crossed 80%. 3 vacant beds remaining.', time: '10:15 AM', resolved: false }
  ]
};

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    if (MONGODB_URI) {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ MongoDB Atlas connected successfully for HOSPITIQ');
    }
  } catch (err) {
    console.warn('ℹ️  MongoDB Atlas connection deferred. Running high-performance in-memory dataset mode.');
  }
};

const getStore = () => memoryStore;

module.exports = { connectDB, getStore };
