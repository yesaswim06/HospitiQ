const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  admNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patient: {
    type: String,
    required: true,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  ward: {
    type: String,
    required: true
  },
  bedNumber: {
    type: String,
    required: true,
    index: true
  },
  doctor: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String,
    default: 'Clinical Inpatient Observation'
  },
  admissionDate: {
    type: String,
    required: true
  },
  dischargeDate: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Admitted', 'Discharged'],
    default: 'Admitted',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admission', admissionSchema);
