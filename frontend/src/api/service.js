import http from './http';

export const loginApi = (payload) => http.post('/auth/login', payload);
export const registerApi = (payload) => http.post('/auth/register', payload);

export const getDashboardSummary = () => http.get('/dashboard/summary');

export const getStaff = (params) => http.get('/staff', { params });
export const getStaffById = (id) => http.get(`/staff/${id}`);
export const createStaff = (payload) => http.post('/staff', payload);
export const updateStaff = (id, payload) => http.put(`/staff/${id}`, payload);
export const softDeleteStaff = (id) => http.delete(`/staff/${id}`);

export const calculatePayroll = (payload) => http.post('/payroll/calculate', payload);
export const getAllPayroll = () => http.get('/payroll');
export const getMyPayroll = () => http.get('/payroll/my');
export const exportPayrollCsv = (params) =>
  http.get('/payroll/export/csv', { params, responseType: 'blob' });
export const exportPayrollPdf = (params) =>
  http.get('/payroll/export/pdf', { params, responseType: 'blob' });

export const getMyProfile = () => http.get('/users/me');
export const updateMyProfile = (payload) => http.put('/users/me', payload);
export const changeMyPassword = (payload) => http.post('/users/me/change-password', payload);
export const getEventBookings = () => http.get('/event-bookings');
export const createEventBooking = (payload) => http.post('/event-bookings', payload);
export const updateEventBooking = (id, payload) => http.put(`/event-bookings/${id}`, payload);
export const deleteEventBooking = (id) => http.delete(`/event-bookings/${id}`);
export const eventAnalytics = () => http.get('/event-bookings/analytics');
