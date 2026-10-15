const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body: { email: string; otp: string }) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  resendOtp: (body: { email: string }) =>
    request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
};

export const electionApi = {
  getAll: () => request('/elections'),
  getActive: () => request('/elections/active'),
  getById: (id: string) => request(`/elections/${id}`),
  create: (body: object) => request('/elections', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request(`/elections/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/elections/${id}`, { method: 'DELETE' }),
};

export const candidateApi = {
  getByElection: (electionId: string) => request(`/candidates/election/${electionId}`),
  create: (body: object) => request('/candidates', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/candidates/${id}`, { method: 'DELETE' }),
};

export const voteApi = {
  cast: (body: { electionId: string; candidateId: string }) =>
    request('/votes', { method: 'POST', body: JSON.stringify(body) }),
  myVotes: () => request('/votes/my-votes'),
  check: (electionId: string) => request(`/votes/check/${electionId}`),
};

export const adminApi = {
  stats: () => request('/admin/stats'),
  results: (electionId: string) => request(`/admin/results/${electionId}`),
  auditLogs: (page = 1) => request(`/admin/audit-logs?page=${page}&limit=50`),
  users: () => request('/admin/users'),
  updateUserRole: (id: string, role: string) =>
    request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
};
