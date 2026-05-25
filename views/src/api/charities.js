import client from './client';

export const getCharities = (params) =>
  client.get('/charities', { params }).then((r) => r.data);

export const getCharity = (id) =>
  client.get(`/charities/${id}`).then((r) => r.data);
