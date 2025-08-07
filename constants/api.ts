// API Configuration for offline mode
export const API_CONFIG = {
  BASE_URL: '', // Empty for offline mode
  ENDPOINTS: {
    // Keep for future backend integration
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

// Add offline mode flag
export const OFFLINE_MODE = false; // Using Firebase now