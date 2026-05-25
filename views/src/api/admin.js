import client from './client';

export const getAdminCharities = (params)   => client.get('/admin/charities', { params }).then(r => r.data);
export const approveCharity    = (id)       => client.put(`/admin/charities/${id}/approve`).then(r => r.data);
export const rejectCharity     = (id, data) => client.put(`/admin/charities/${id}/reject`, data).then(r => r.data);
export const getAdminUsers     = (params)   => client.get('/admin/users', { params }).then(r => r.data);
export const deactivateUser    = (id)       => client.delete(`/admin/users/${id}`).then(r => r.data);
export const getAllDonations    = (params)   => client.get('/admin/donations', { params }).then(r => r.data);
