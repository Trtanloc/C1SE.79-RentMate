import axiosClient from './axiosClient';

/**
 * Quản lý business logic (API routes, data transformation)
 * API Endpoints - All backend calls return envelope: { success, data, error, message }
 */

// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await axiosClient.post('/auth/login', credentials);
      return response; // { success: true, data: { user, token }, message: "Login successful" }
    } catch (error) {
      return error; // { success: false, data: null, error: "...", message: "..." }
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await axiosClient.post('/auth/register', userData);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await axiosClient.get('/auth/profile');
      return response;
    } catch (error) {
      return error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await axiosClient.post('/auth/logout');
      return response;
    } catch (error) {
      return error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await axiosClient.post('/auth/refresh');
      return response;
    } catch (error) {
      return error;
    }
  }
};

// ==================== PROPERTY ENDPOINTS ====================
export const propertyAPI = {
  // Get all properties with filters
  getProperties: async (filters = {}) => {
    try {
      const response = await axiosClient.get('/properties', { params: filters });
      return response;
    } catch (error) {
      return error;
    }
  },

  // Get single property by ID
  getPropertyById: async (id) => {
    try {
      const response = await axiosClient.get(`/properties/${id}`);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Create new property listing
  createProperty: async (propertyData) => {
    try {
      const response = await axiosClient.post('/properties', propertyData);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Update property
  updateProperty: async (id, propertyData) => {
    try {
      const response = await axiosClient.put(`/properties/${id}`, propertyData);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Delete property
  deleteProperty: async (id) => {
    try {
      const response = await axiosClient.delete(`/properties/${id}`);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Upload property images
  uploadImages: async (propertyId, formData) => {
    try {
      const response = await axiosClient.post(
        `/properties/${propertyId}/images`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return response;
    } catch (error) {
      return error;
    }
  }
};

// ==================== LANDLORD ENDPOINTS ====================
export const landlordAPI = {
  // Get landlord dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await axiosClient.get('/landlord/dashboard');
      return response;
    } catch (error) {
      return error;
    }
  },

  // Get landlord's properties
  getMyProperties: async () => {
    try {
      const response = await axiosClient.get('/landlord/properties');
      return response;
    } catch (error) {
      return error;
    }
  },

  // Get messages for landlord
  getMessages: async () => {
    try {
      const response = await axiosClient.get('/landlord/messages');
      return response;
    } catch (error) {
      return error;
    }
  }
};

// ==================== REVIEW ENDPOINTS ====================
export const reviewAPI = {
  // Get reviews for property
  getPropertyReviews: async (propertyId) => {
    try {
      const response = await axiosClient.get(`/properties/${propertyId}/reviews`);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Create review
  createReview: async (propertyId, reviewData) => {
    try {
      const response = await axiosClient.post(`/properties/${propertyId}/reviews`, reviewData);
      return response;
    } catch (error) {
      return error;
    }
  }
};

// ==================== FAVORITE ENDPOINTS ====================
export const favoriteAPI = {
  // Get user's favorite properties
  getFavorites: async () => {
    try {
      const response = await axiosClient.get('/favorites');
      return response;
    } catch (error) {
      return error;
    }
  },

  // Add property to favorites
  addFavorite: async (propertyId) => {
    try {
      const response = await axiosClient.post('/favorites', { propertyId });
      return response;
    } catch (error) {
      return error;
    }
  },

  // Remove property from favorites
  removeFavorite: async (propertyId) => {
    try {
      const response = await axiosClient.delete(`/favorites/${propertyId}`);
      return response;
    } catch (error) {
      return error;
    }
  }
};

//  CHAT/MESSAGE ENDPOINTS 
export const messageAPI = {
  // Get conversations
  getConversations: async () => {
    try {
      const response = await axiosClient.get('/messages/conversations');
      return response;
    } catch (error) {
      return error;
    }
  },

  // Get messages in conversation
  getMessages: async (conversationId) => {
    try {
      const response = await axiosClient.get(`/messages/${conversationId}`);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Send message
  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await axiosClient.post(`/messages/${conversationId}`, messageData);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Start new conversation with landlord
  startConversation: async (landlordId, propertyId) => {
    try {
      const response = await axiosClient.post('/messages/conversations', {
        landlordId,
        propertyId
      });
      return response;
    } catch (error) {
      return error;
    }
  }
};

// AI CHAT ENDPOINTS 
export const aiChatAPI = {
  // Send message to AI assistant
  sendMessage: async (message, context = {}) => {
    try {
      const response = await axiosClient.post('/ai/chat', {
        message,
        context
      });
      return response;
    } catch (error) {
      return error;
    }
  },

  // Get chat history
  getChatHistory: async () => {
    try {
      const response = await axiosClient.get('/ai/chat/history');
      return response;
    } catch (error) {
      return error;
    }
  }
};
