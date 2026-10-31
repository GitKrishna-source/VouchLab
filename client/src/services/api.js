const API_BASE = '/api';

function getHeaders(isFormData = false) {
  const headers = {};
  const token = localStorage.getItem('vouchlab_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: (credentials) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify(credentials) }),
  getDemoAccounts: () => request('/auth/demo-accounts'),
  getCurrentUser: () => request('/auth/me'),

  // Resources
  getResources: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/resources?${query}`);
  },
  getResource: (id) => request(`/resources/${id}`),
  getResourceSlots: (id, date) => request(`/resources/${id}/slots?date=${date || ''}`),
  createResource: (data) => request('/resources', { method: 'POST', body: JSON.stringify(data) }),

  // Passport & Requirements
  getMyPassport: () => request('/passport/my-passport'),
  getQuizByRequirement: (reqId) => request(`/passport/quiz-by-requirement/${reqId}`),
  submitQuiz: (quizId, answers) => request(`/passport/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  uploadCertificate: (formData) => request('/passport/certificates/upload', { method: 'POST', body: formData }),
  getPendingCertificates: () => request('/passport/certificates/pending'),
  reviewCertificate: (id, action, notes) => request(`/passport/certificates/${id}/review`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  requestSignoff: (requirement_id, resource_id, notes) => request('/passport/signoffs/request', { method: 'POST', body: JSON.stringify({ requirement_id, resource_id, notes }) }),
  reviewSignoff: (id, action, notes) => request(`/passport/signoffs/${id}/review`, { method: 'POST', body: JSON.stringify({ action, notes }) }),

  // Bookings
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: (status) => request(`/bookings/my-bookings?status=${status || 'All'}`),
  getIncomingRequests: () => request('/bookings/incoming-requests'),
  getResourceQueue: (resourceId) => request(`/bookings/queue/${resourceId}`),
  decideBooking: (id, action, override_reason) => request(`/bookings/${id}/decide`, { method: 'POST', body: JSON.stringify({ action, override_reason }) }),
  checkinBooking: (id, formData) => request(`/bookings/${id}/checkin`, { method: 'POST', body: formData }),
  returnBooking: (id, formData) => request(`/bookings/${id}/return`, { method: 'POST', body: formData }),
  cancelBooking: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  extendBooking: (id, new_end_time, reason) => request(`/bookings/${id}/extend`, { method: 'POST', body: JSON.stringify({ new_end_time, reason }) }),
  getBookingDetail: (id) => request(`/bookings/${id}`),

  // Incidents
  getIncidents: () => request('/incidents'),
  getIncident: (id) => request(`/incidents/${id}`),
  resolveIncident: (id, resolution_notes, action_taken) => request(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution_notes, action_taken }) }),

  // Audit Chain
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit?${query}`);
  },
  verifyAuditChain: () => request('/audit/verify'),
  tamperAuditRow: (row_id, payload) => request('/audit/tamper', { method: 'POST', body: JSON.stringify({ row_id, payload }) }),
  restoreAuditRow: () => request('/audit/restore', { method: 'POST' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Admin & Demo
  getAdminStats: () => request('/admin/stats'),
  getFairnessConfig: () => request('/admin/fairness-config'),
  updateFairnessConfig: (config) => request('/admin/fairness-config', { method: 'PUT', body: JSON.stringify(config) }),
  resetDemoDatabase: () => request('/admin/reset-demo', { method: 'POST' })
};

