const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  bedNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ward: {
    type: String,
    enum: ['ICU', 'Emergency', 'General Ward', 'Private Ward', 'Semi-Private', 'Pediatric', 'Maternity'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
    default: 'AVAILABLE',
    index: true
  },
  patient: {
    type: String,
    default: null
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  doctor: {
    type: String,
    default: null
  },
  admissionDate: {
    type: String,
    default: null
  },
  hasVentilator: {
    type: Boolean,
    default: false
  },
  hasOxygen: {
    type: Boolean,
    default: true
  },
  isIsolation: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bed', bedSchema);
