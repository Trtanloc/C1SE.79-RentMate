import axiosClient from './axiosClient.js';

export const fetchReviewsByProperty = async (propertyId) => {
  const { data } = await axiosClient.get(`/reviews/property/${propertyId}`);
  return data?.data ?? [];
};

export const createReview = async (payload) => {
  const { data } = await axiosClient.post('/reviews', payload);
  return data?.data;
};

export const deleteReview = async (id) => {
  await axiosClient.delete(`/reviews/${id}`);
};

export const fetchPublicReviews = async () => {
  const { data } = await axiosClient.get('/reviews');
  return data?.data ?? [];
};

export const approveReview = async (id, approved = true) => {
  const { data } = await axiosClient.patch(`/reviews/${id}/approve`, {
    approved,
  });
  return data?.data;
};
