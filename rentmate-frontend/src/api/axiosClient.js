import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
});

axiosClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('rentmate_token') ||
    sessionStorage.getItem('rentmate_token');
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
      sessionStorage.removeItem('rentmate_token');
      sessionStorage.removeItem('rentmate_user');
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
