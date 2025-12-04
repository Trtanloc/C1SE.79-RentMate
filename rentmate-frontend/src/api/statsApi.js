import axiosClient from './axiosClient.js';

export const fetchOverviewStats = async () => {
  const { data } = await axiosClient.get('/stats/overview');
  return data.data;
};

export const fetchCategoryHighlights = async () => {
  const { data } = await axiosClient.get('/stats/categories');
  return data.data;
};
