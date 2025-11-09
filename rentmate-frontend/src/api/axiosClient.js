import axios from 'axios';

// Default to '/api' as base URL for API calls
const axiosClient = axios.create({
  baseURL: '/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rentmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('rentmate_token');
      localStorage.removeItem('rentmate_user');
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
