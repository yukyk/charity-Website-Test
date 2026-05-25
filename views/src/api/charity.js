import client from './client';

export const getMyCharity        = ()             => client.get('/charities/mine').then(r => r.data);
export const registerCharity     = (data)         => client.post('/charities', data).then(r => r.data);
export const updateCharity       = (id, data)     => client.put(`/charities/${id}`, data).then(r => r.data);
export const getCharityProjects  = (id)           => client.get(`/charities/${id}/projects`).then(r => r.data);
export const addProject          = (id, data)     => client.post(`/charities/${id}/projects`, data).then(r => r.data);
export const updateProject       = (id, pid, d)   => client.put(`/charities/${id}/projects/${pid}`, d).then(r => r.data);
export const getCharityDonations = (id, params)   => client.get(`/charities/${id}/donations`, { params }).then(r => r.data);
export const getImpactReports    = (id)           => client.get(`/charities/${id}/impact-reports`).then(r => r.data);
export const addImpactReport     = (id, data)     => client.post(`/charities/${id}/impact-reports`, data).then(r => r.data);
