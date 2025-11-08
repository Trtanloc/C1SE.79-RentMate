import axios from 'axios';

//Quản lý HTTP logic (headers, interceptors, config)//
// API Base URL - update this based on your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle response envelopes and errors
axiosClient.interceptors.response.use(
  (response) => {
    // Backend returns: { success: true, data: {...}, message: "..." }
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    const errorResponse = {
      success: false,
      data: null,
      error: 'An error occurred',
      message: 'Something went wrong'
    };

    if (error.response) {
      // Server responded with error status
      errorResponse.error = error.response.data?.error || error.response.statusText;
      errorResponse.message = error.response.data?.message || 'Server error';
      
      // Handle unauthorized - redirect to login
      if (error.response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/#auth';
      }
    } else if (error.request) {
      // Request made but no response
      errorResponse.error = 'Network error';
      errorResponse.message = 'Unable to connect to server. Please check your internet connection.';
    } else {
      // Error in request setup
      errorResponse.error = error.message;
    }

    return Promise.reject(errorResponse);
  }
);

export default axiosClient;
