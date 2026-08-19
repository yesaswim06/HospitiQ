const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://tarunkumarn999_db_user:yQrv08IV1xbStmHo@cluster0.mongodb.net/hospitiq?retryWrites=true&w=majority";

// HOSPITIQ High Performance Rich Dataset (8 Doctors, 10 Patients, 100 Beds)
const memoryStore = {
  users: [
    { id: 'usr-adm-1', name: 'Dr. Rajesh Sharma', role: 'Admin', email: 'admin@hospitiq.org', department: 'Administration' },
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
    { id: 'q-101', tokenNumber: 'A-024', patientName: 'Ramesh Verma', age: 44, gender: 'Male', phone: '+91 99000 11223', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 0, patientsAhead: 0, room: 'OPD Room #104', priority: 'High', status: 'In Consultation', registrationTime: '09:45 AM', smsSent: true, whatsappSent: true },
    { id: 'q-102', tokenNumber: 'A-031', patientName: 'Priya Sundaram', age: 32, gender: 'Female', phone: '+91 98765 43210', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 28, patientsAhead: 3, room: 'OPD Room #104', priority: 'Normal', status: 'Waiting', registrationTime: '10:15 AM', smsSent: true, whatsappSent: true },
    { id: 'q-103', tokenNumber: 'B-012', patientName: 'Amitabh Sen', age: 58, gender: 'Male', phone: '+91 91234 56789', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 14, patientsAhead: 1, room: 'OPD Room #108', priority: 'Normal', status: 'Waiting', registrationTime: '10:20 AM', smsSent: true, whatsappSent: true },
    { id: 'q-104', tokenNumber: 'EM-501', patientName: 'Sanjay Dutt', age: 50, gender: 'Male', phone: '+91 91100 00911', department: 'Emergency', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 0, patientsAhead: 0, room: 'ER Bay #01', priority: 'Emergency', status: 'In Consultation', registrationTime: '10:30 AM', smsSent: true, whatsappSent: true },
    { id: 'q-105', tokenNumber: 'P-008', patientName: 'Kavita Krishnan', age: 27, gender: 'Female', phone: '+91 98765 11122', department: 'Pediatrics', doctor: 'Dr. Hrishikesh Deshmukh', doctorId: 'doc-4', waitTime: 12, patientsAhead: 1, room: 'OPD Room #105', priority: 'Normal', status: 'Waiting', registrationTime: '10:35 AM', smsSent: true, whatsappSent: true },
    { id: 'q-106', tokenNumber: 'O-019', patientName: 'Deepak Nair', age: 39, gender: 'Male', phone: '+91 98765 22233', department: 'Orthopedics', doctor: 'Dr. Ananya Reddy', doctorId: 'doc-3', waitTime: 20, patientsAhead: 2, room: 'OPD Room #201', priority: 'High', status: 'Waiting', registrationTime: '10:40 AM', smsSent: true, whatsappSent: true },
    { id: 'q-107', tokenNumber: 'N-005', patientName: 'Sunil Gavaskar', age: 62, gender: 'Male', phone: '+91 98765 33344', department: 'Neurology', doctor: 'Dr. Priya Patel', doctorId: 'doc-5', waitTime: 15, patientsAhead: 1, room: 'OPD Room #304', priority: 'Normal', status: 'Waiting', registrationTime: '10:45 AM', smsSent: true, whatsappSent: true },
    { id: 'q-108', tokenNumber: 'D-014', patientName: 'Ayesha Takia', age: 29, gender: 'Female', phone: '+91 98765 44455', department: 'Dermatology', doctor: 'Dr. Suresh Menon', doctorId: 'doc-6', waitTime: 10, patientsAhead: 1, room: 'OPD Room #110', priority: 'Normal', status: 'Waiting', registrationTime: '10:50 AM', smsSent: true, whatsappSent: true },
    { id: 'q-109', tokenNumber: 'E-007', patientName: 'Rohan Bopanna', age: 41, gender: 'Male', phone: '+91 98765 55566', department: 'ENT', doctor: 'Dr. Meera Nambiar', doctorId: 'doc-7', waitTime: 18, patientsAhead: 2, room: 'OPD Room #115', priority: 'Normal', status: 'Waiting', registrationTime: '10:55 AM', smsSent: true, whatsappSent: true },
    { id: 'q-110', tokenNumber: 'B-018', patientName: 'Sneha Roy', age: 35, gender: 'Female', phone: '+91 98765 66677', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 32, patientsAhead: 3, room: 'OPD Room #108', priority: 'Normal', status: 'Waiting', registrationTime: '11:00 AM', smsSent: true, whatsappSent: true }
  ],
  doctors: [
    { id: 'doc-1', name: 'Dr. Sunita Rao', specialization: 'Interventional Cardiology', department: 'Cardiology', status: 'Busy', patientsWaiting: 2, currentPatient: 'A-024 (Ramesh Verma)', room: 'OPD Room #104', phone: '+91 98111 22233', email: 'doctor@hospitiq.org' },
    { id: 'doc-2', name: 'Dr. Vikram Malhotra', specialization: 'Internal Medicine', department: 'General Medicine', status: 'Available', patientsWaiting: 2, currentPatient: 'EM-501 (Sanjay Dutt)', room: 'OPD Room #108', phone: '+91 98222 33344', email: 'vikram@hospitiq.org' },
    { id: 'doc-3', name: 'Dr. Ananya Reddy', specialization: 'Orthopedic Surgery', department: 'Orthopedics', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #201', phone: '+91 98333 44455', email: 'ananya@hospitiq.org' },
    { id: 'doc-4', name: 'Dr. Hrishikesh Deshmukh', specialization: 'Pediatric Care & Child Health', department: 'Pediatrics', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #105', phone: '+91 98444 55566', email: 'hrishi@hospitiq.org' },
    { id: 'doc-5', name: 'Dr. Priya Patel', specialization: 'Neurology & Stroke Triage', department: 'Neurology', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #304', phone: '+91 98555 66677', email: 'priya@hospitiq.org' },
    { id: 'doc-6', name: 'Dr. Suresh Menon', specialization: 'Clinical Dermatology', department: 'Dermatology', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #110', phone: '+91 98666 77788', email: 'suresh@hospitiq.org' },
    { id: 'doc-7', name: 'Dr. Meera Nambiar', specialization: 'Otolaryngology (ENT)', department: 'ENT', status: 'Available', patientsWaiting: 1, currentPatient: 'None', room: 'OPD Room #115', phone: '+91 98777 88899', email: 'meera@hospitiq.org' },
    { id: 'doc-8', name: 'Dr. Rajesh Sharma', specialization: 'Cardiac Electrophysiology', department: 'Cardiology', status: 'Available', patientsWaiting: 0, currentPatient: 'None', room: 'OPD Room #102', phone: '+91 98888 99900', email: 'admin@hospitiq.org' }
  ],
  beds: Array.from({ length: 100 }, (_, i) => {
    const bedId = i + 1;
    let ward = 'General Ward';
    if (bedId <= 15) ward = 'ICU';
    else if (bedId <= 30) ward = 'Emergency';
    else if (bedId <= 60) ward = 'General Ward';
    else if (bedId <= 75) ward = 'Private Ward';
    else if (bedId <= 85) ward = 'Semi-Private';
    else if (bedId <= 92) ward = 'Pediatric';
    else ward = 'Maternity';

    const isOccupied = bedId % 3 !== 0;
    return {
      id: `bed-${bedId}`,
      bedNumber: `${ward.substring(0, 3).toUpperCase()}-${String(bedId).padStart(3, '0')}`,
      ward,
      status: isOccupied ? 'Occupied' : 'Available',
      patient: isOccupied ? `Patient #${1000 + bedId}` : null,
      doctor: isOccupied ? 'Dr. Sunita Rao' : null,
      admissionDate: isOccupied ? '2026-08-18' : null,
      features: bedId <= 15 ? ['Ventilator', 'O2 Outlet', 'Cardiac Monitor'] : ['O2 Outlet', 'Call Button']
    };
  }),
  departments: [
    { name: 'Cardiology', currentQueue: 8, avgWaitMins: 28, doctorsAvailable: 3, status: 'High Load' },
    { name: 'General Medicine', currentQueue: 12, avgWaitMins: 20, doctorsAvailable: 4, status: 'Normal' },
    { name: 'Orthopedics', currentQueue: 5, avgWaitMins: 15, doctorsAvailable: 2, status: 'Normal' },
    { name: 'Pediatrics', currentQueue: 4, avgWaitMins: 12, doctorsAvailable: 2, status: 'Normal' },
    { name: 'Neurology', currentQueue: 3, avgWaitMins: 15, doctorsAvailable: 1, status: 'Normal' },
    { name: 'Dermatology', currentQueue: 2, avgWaitMins: 10, doctorsAvailable: 1, status: 'Normal' },
    { name: 'ENT', currentQueue: 3, avgWaitMins: 18, doctorsAvailable: 1, status: 'Normal' },
    { name: 'Emergency', currentQueue: 3, avgWaitMins: 0, doctorsAvailable: 3, status: 'Critical' }
  ],
  admissions: [
    { id: 'adm-101', patientName: 'Ramesh Verma', ward: 'ICU', bedNumber: 'ICU-004', doctor: 'Dr. Sunita Rao', diagnosis: 'Acute Cardiac Observation', admissionDate: '2026-08-18', status: 'Admitted' },
    { id: 'adm-102', patientName: 'Sanjay Dutt', ward: 'Emergency', bedNumber: 'EME-018', doctor: 'Dr. Vikram Malhotra', diagnosis: 'Trauma Monitoring', admissionDate: '2026-08-19', status: 'Admitted' }
  ],
  alerts: [
    { id: 'alt-1', type: 'critical', title: 'ICU Capacity Alert', message: 'ICU Ward occupancy has reached 90%. Prepare overflow units.', time: '10 mins ago', resolved: false },
    { id: 'alt-2', type: 'warning', title: 'High OPD Load', message: 'Cardiology OPD queue is experiencing higher than average wait times.', time: '25 mins ago', resolved: false }
  ]
};

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Atlas Cloud');
  } catch (err) {
    console.warn('🔄 Falling back to HOSPITIQ High-Performance In-Memory Dataset.');
  }
}

function getStore() {
  return memoryStore;
}

module.exports = { connectDB, getStore };
