// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.7:3000',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    HABITS: '/api/habits',
    HEALTH: '/health'
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};