// Centralized API configuration helper
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Ensure no trailing slash for consistency
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
export default API_URL;
