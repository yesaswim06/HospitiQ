const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'Operations'
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
