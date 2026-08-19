const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://tarunkumarn999_db_user:yQrv08IV1xbStmHo@cluster0.mongodb.net/hospitiq?retryWrites=true&w=majority";

// HOSPITIQ In-Memory High Performance Dataset
const memoryStore = {
  users: [
    { id: 'usr-adm-1', name: 'Dr. Rajesh Sharma', role: 'Admin', email: 'admin@hospitiq.org', department: 'Administration' },
    { id: 'usr-doc-1', name: 'Dr. Sunita Rao', role: 'Doctor', email: 'doctor@hospitiq.org', department: 'Cardiology' },
    { id: 'usr-doc-2', name: 'Dr. Vikram Malhotra', role: 'Doctor', email: 'vikram@hospitiq.org', department: 'General Medicine' },
    { id: 'usr-pt-1', name: 'Ramesh Verma', role: 'Patient', email: 'patient@hospitiq.org', tokenNumber: 'A-031' }
  ],
  queue: [
    { id: 'q-101', tokenNumber: 'A-024', patientName: 'Ramesh Verma', age: 44, gender: 'Male', phone: '+91 99000 11223', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 0, patientsAhead: 0, room: 'OPD Room #104', priority: 'High', status: 'In Consultation', registrationTime: '09:45 AM', smsSent: true, whatsappSent: true },
    { id: 'q-102', tokenNumber: 'A-031', patientName: 'Priya Sundaram', age: 32, gender: 'Female', phone: '+91 98765 43210', department: 'Cardiology', doctor: 'Dr. Sunita Rao', doctorId: 'doc-1', waitTime: 28, patientsAhead: 3, room: 'OPD Room #104', priority: 'Normal', status: 'Waiting', registrationTime: '10:15 AM', smsSent: true, whatsappSent: true },
    { id: 'q-103', tokenNumber: 'B-012', patientName: 'Amitabh Sen', age: 58, gender: 'Male', phone: '+91 91234 56789', department: 'General Medicine', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 14, patientsAhead: 1, room: 'OPD Room #108', priority: 'Normal', status: 'Waiting', registrationTime: '10:20 AM', smsSent: true, whatsappSent: true },
    { id: 'q-104', tokenNumber: 'EM-501', patientName: 'Sanjay Dutt', age: 50, gender: 'Male', phone: '+91 91100 00911', department: 'Emergency', doctor: 'Dr. Vikram Malhotra', doctorId: 'doc-2', waitTime: 0, patientsAhead: 0, room: 'ER Bay #01', priority: 'Emergency', status: 'In Consultation', registrationTime: '10:30 AM', smsSent: true, whatsappSent: true }
  ],
  doctors: [
    { id: 'doc-1', name: 'Dr. Sunita Rao', specialization: 'Interventional Cardiology', department: 'Cardiology', status: 'Busy', patientsWaiting: 3, currentPatient: 'A-024 (Ramesh Verma)', room: 'OPD Room #104', phone: '+91 98111 22233', email: 'doctor@hospitiq.org' },
    { id: 'doc-2', name: 'Dr. Vikram Malhotra', specialization: 'Internal Medicine', department: 'General Medicine', status: 'Available', patientsWaiting: 1, currentPatient: 'EM-501 (Sanjay Dutt)', room: 'OPD Room #108', phone: '+91 98222 33344', email: 'vikram@hospitiq.org' },
    { id: 'doc-3', name: 'Dr. Ananya Reddy', specialization: 'Orthopedic Surgery', department: 'Orthopedics', status: 'Available', patientsWaiting: 2, currentPatient: 'None', room: 'OPD Room #201', phone: '+91 98333 44455', email: 'ananya@hospitiq.org' },
    { id: 'doc-4', name: 'Dr. Hrishikesh Deshmukh', specialization: 'Pediatric Care', department: 'Pediatrics', status: 'On Break', patientsWaiting: 0, currentPatient: 'None', room: 'OPD Room #105', phone: '+91 98444 55566', email: 'hrishi@hospitiq.org' }
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
