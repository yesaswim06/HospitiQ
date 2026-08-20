/* ==========================================================================
   HOSPITIQ — REST API CLIENT SERVICE
   ========================================================================== */

const API_BASE = window.HOSPITIQ_API_URL || '/api';

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach session token if available
  const token = window.sessionStorage?.getItem('hospitiq_auth_token') || (window.appState && window.appState.sessionToken);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data.error || `HTTP_${res.status}`,
        message: data.message || `Request failed with status ${res.status}`
      };
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to connect to HOSPITIQ server. Running in offline/cached mode.'
    };
  }
};

const api = {
  // 1. Auth
  async login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async getMe() {
    return request('/auth/me');
  },

  // 2. Patient Token Public Lookup
  async getPatientToken(tokenNumber) {
    return request(`/patient/${encodeURIComponent(tokenNumber)}`);
  },

  // 3. Stats & Capacity
  async getStats() {
    return request('/stats');
  },

  async getCapacity() {
    return request('/capacity');
  },

  // 4. Queue CRUD
  async getQueue() {
    return request('/queue');
  },

  async createToken(tokenData) {
    return request('/queue/token', {
      method: 'POST',
      body: JSON.stringify(tokenData)
    });
  },

  async callNextToken(doctorId) {
    return request('/queue/call-next', {
      method: 'POST',
      body: JSON.stringify({ doctorId })
    });
  },

  async updateQueueStatus(tokenId, status) {
    return request(`/queue/${encodeURIComponent(tokenId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // 5. Doctors
  async getDoctors() {
    return request('/doctors');
  },

  async updateDoctorStatus(doctorId, status) {
    return request(`/doctors/${encodeURIComponent(doctorId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async addDoctor(doctorData) {
    return request('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData)
    });
  },

  async deleteDoctor(doctorId) {
    return request(`/doctors/${encodeURIComponent(doctorId)}`, {
      method: 'DELETE'
    });
  },

  // 6. Beds & Admissions
  async getBeds() {
    return request('/beds');
  },

  async recommendBed(criteria) {
    return request('/admissions/recommend-bed', {
      method: 'POST',
      body: JSON.stringify(criteria)
    });
  },

  async admitPatientToBed(bedId, data) {
    return request(`/beds/${encodeURIComponent(bedId)}/admit`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async dischargePatientFromBed(bedId) {
    return request(`/beds/${encodeURIComponent(bedId)}/discharge`, {
      method: 'PUT'
    });
  },

  async getAdmissions() {
    return request('/admissions');
  },

  // 7. Emergency & Insights
  async triggerEmergencySiren() {
    return request('/emergency/siren', {
      method: 'POST'
    });
  },

  async getInsights() {
    return request('/insights');
  },

  async getDepartments() {
    return request('/departments');
  },

  async getPatients() {
    return request('/patients');
  }
};
