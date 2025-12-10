import axiosClient from './axiosClient.js';

export const fetchMetadataFilters = async () => {
  const { data } = await axiosClient.get('/metadata/filters');
  return data.data;
};
