const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  docId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  specialization: {
    type: String,
    required: true
  },
  room: {
    type: String,
    default: 'OPD Room #104'
  },
  phone: {
    type: String,
    default: '+91 98111 22233'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'CONSULTING', 'ON_BREAK', 'OFFLINE'],
    default: 'AVAILABLE',
    index: true
  },
  patientsWaiting: {
    type: Number,
    default: 0
  },
  currentPatient: {
    type: String,
    default: 'None'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
