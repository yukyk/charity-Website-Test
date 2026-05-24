import client from './client';

export const register       = (data)  => client.post('/auth/register',        data).then(r => r.data);
export const login          = (data)  => client.post('/auth/login',            data).then(r => r.data);
export const verifyEmail    = (token) => client.post('/auth/verify-email',     { token }).then(r => r.data);
export const forgotPassword = (email) => client.post('/auth/forgot-password',  { email }).then(r => r.data);
export const resetPassword  = (data)  => client.post('/auth/reset-password',   data).then(r => r.data);
export const logoutAPI      = ()      => client.post('/auth/logout').then(r => r.data);
