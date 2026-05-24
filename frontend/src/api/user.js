import client from './client';

export const getProfile     = ()       => client.get('/users/profile').then(r => r.data);
export const updateProfile  = (data)   => client.put('/users/profile', data).then(r => r.data);
export const changePassword = (data)   => client.put('/users/change-password', data).then(r => r.data);
export const getMyDonations = (params) => client.get('/users/donations', { params }).then(r => r.data);
export const getNotifications         = (params) => client.get('/notifications', { params }).then(r => r.data);
export const markNotificationRead     = (id)     => client.put(`/notifications/${id}/read`).then(r => r.data);
export const markAllNotificationsRead = ()       => client.put('/notifications/read-all').then(r => r.data);
export const getUnreadCount           = ()       => client.get('/notifications/unread-count').then(r => r.data);
