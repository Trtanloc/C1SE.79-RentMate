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
