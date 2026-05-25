import apiClient from './client';

export const createDonationOrder = (data) =>
  apiClient.post('/donations/create-order', data);

export const verifyPayment = (data) =>
  apiClient.post('/donations/verify-payment', data);

export const getDonation = (id) =>
  apiClient.get(`/donations/${id}`);

export const getDonationReceipt = (id) =>
  apiClient.get(`/donations/${id}/receipt`);
