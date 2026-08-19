/* ==========================================================================
   HOSPITIQ — REST API CLIENT SERVICE
   ========================================================================== */

const API_BASE = window.HOSPITIQ_API_URL || (window.location.origin.includes('localhost') ? '/api' : 'https://hospitiq.onrender.com/api');

const api = {
  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  async getPatientToken(tokenNumber) {
    const res = await fetch(`${API_BASE}/patient/${tokenNumber}`);
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  async getCapacity() {
    const res = await fetch(`${API_BASE}/capacity`);
    return res.json();
  },

  async getQueue() {
    const res = await fetch(`${API_BASE}/queue`);
    return res.json();
  },

  async createToken(tokenData) {
    const res = await fetch(`${API_BASE}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData)
    });
    return res.json();
  },

  async callNextToken(doctorId) {
    const res = await fetch(`${API_BASE}/queue/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId })
    });
    return res.json();
  },

  async updateQueueStatus(tokenId, status) {
    const res = await fetch(`${API_BASE}/queue/${tokenId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async updateDoctorStatus(doctorId, status) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async recommendBed(criteria) {
    const res = await fetch(`${API_BASE}/admissions/recommend-bed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria)
    });
    return res.json();
  },

  async allocateBed(data) {
    const res = await fetch(`${API_BASE}/admissions/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async dischargePatient(bedId) {
    const res = await fetch(`${API_BASE}/discharges/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedId })
    });
    return res.json();
  },

  async createEmergencyIntake(data) {
    const res = await fetch(`${API_BASE}/emergency/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getDoctors() {
    const res = await fetch(`${API_BASE}/doctors`);
    return res.json();
  },

  async addDoctor(doctorData) {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    return res.json();
  },

  async deleteDoctor(doctorId) {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getBeds() {
    const res = await fetch(`${API_BASE}/beds`);
    return res.json();
  },

  async updateBed(bedId, bedData) {
    const res = await fetch(`${API_BASE}/beds/${bedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bedData)
    });
    return res.json();
  },

  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`);
    return res.json();
  },

  async getPatients() {
    const res = await fetch(`${API_BASE}/patients`);
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json();
  },

  async getInsights() {
    const res = await fetch(`${API_BASE}/insights`);
    return res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`);
    return res.json();
  },

  async resolveAlert(alertId) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
      method: 'POST'
    });
    return res.json();
  }
};
