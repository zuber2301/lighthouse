import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add interceptor for tenant id
api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenant_id') || '00000000-0000-0000-0000-000000000000';
  config.headers['X-Tenant-ID'] = tenantId;
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getRewards = async () => {
  const response = await api.get('/rewards/');
  return response.data;
};

export const redeemReward = async (rewardId) => {
  const response = await api.post(`/rewards/${rewardId}/redeem`);
  return response.data;
};

export const getBalance = async () => {
  const response = await api.get('/auth/me'); // Assuming user object has balance or there's a balance endpoint
  return response.data;
};
