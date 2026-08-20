const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  secToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  phone: {
    type: String,
    trim: true,
    default: '+91 99000 11223'
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  doctor: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  room: {
    type: String,
    default: 'OPD Room #104'
  },
  priority: {
    type: String,
    enum: ['Emergency', 'High', 'Normal'],
    default: 'Normal',
    index: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'WAITING',
    index: true
  },
  waitTime: {
    type: Number,
    default: 15
  },
  patientsAhead: {
    type: Number,
    default: 0
  },
  registrationTime: {
    type: String
  },
  calledAt: {
    type: Date
  },
  consultationStartedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  smsSent: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Composite index for fast queue sorting: priority descending, registration time ascending
tokenSchema.index({ status: 1, priority: 1, createdAt: 1 });

module.exports = mongoose.model('Token', tokenSchema);
