import axiosClient from './axiosClient.js';

export const fetchFavorites = async () => {
  const { data } = await axiosClient.get('/favorites');
  return data?.data ?? [];
};

export const addFavorite = async (propertyId) => {
  const { data } = await axiosClient.post('/favorites', { propertyId });
  return data?.data;
};

export const removeFavorite = async (propertyId) => {
  await axiosClient.delete(`/favorites/${propertyId}`);
};
