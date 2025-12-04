import axiosClient from './axiosClient.js';

export const fetchTestimonials = async () => {
  const { data } = await axiosClient.get('/testimonials');
  return data.data;
};
