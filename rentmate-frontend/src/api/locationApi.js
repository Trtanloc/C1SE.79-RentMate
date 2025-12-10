import axiosClient from './axiosClient.js';

export const fetchProvinces = async () => {
  const { data } = await axiosClient.get('/metadata/locations/provinces');
  return data.data || [];
};

export const fetchDistricts = async (provinceCode) => {
  if (!provinceCode) return [];
  const { data } = await axiosClient.get(
    `/metadata/locations/provinces/${provinceCode}/districts`,
  );
  return data.data || [];
};

export const fetchWards = async (districtCode) => {
  if (!districtCode) return [];
  const { data } = await axiosClient.get(
    `/metadata/locations/districts/${districtCode}/wards`,
  );
  return data.data || [];
};
