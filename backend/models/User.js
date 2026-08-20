const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Doctor', 'Patient'],
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    default: 'General'
  },
  tokenNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
