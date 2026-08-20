const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
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
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  activeTokenNumber: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    default: 'General Medicine'
  },
  status: {
    type: String,
    enum: ['Waiting', 'In Consultation', 'Completed', 'Admitted', 'Discharged'],
    default: 'Waiting'
  },
  medicalHistory: [{
    type: String
  }],
  lastProblemDescription: {
    type: String,
    trim: true,
    default: ''
  },
  lastTriagePriority: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4', 'P5', 'Normal', 'High', 'Emergency'],
    default: 'P4'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
