import http from "./http";

export const loginApi = (payload) => http.post("/auth/login", payload);
export const registerApi = (payload) => http.post("/auth/register", payload);

export const getDashboardSummary = () => http.get("/dashboard/summary");

export const getStaff = (params) => http.get("/staff", { params });
export const getStaffById = (id) => http.get(`/staff/${id}`);
export const createStaff = (payload) => http.post("/staff", payload);
export const updateStaff = (id, payload) => http.put(`/staff/${id}`, payload);
export const softDeleteStaff = (id) => http.delete(`/staff/${id}`);

export const calculatePayroll = (payload) => http.post("/payroll/calculate", payload);
export const getAllPayroll = () => http.get("/payroll");
export const getMyPayroll = () => http.get("/payroll/my");
export const exportPayrollCsv = (params) => http.get("/payroll/export/csv", { params, responseType: "blob" });
export const exportPayrollPdf = (params) => http.get("/payroll/export/pdf", { params, responseType: "blob" });

export const getMyProfile = () => http.get("/users/me");
export const updateMyProfile = (payload) => http.put("/users/me", payload);
export const changeMyPassword = (payload) => http.post("/users/me/change-password", payload);

export const createRoomRecord = (payload) => http.post("/rooms", payload);
export const createRoomBooking = (payload) => http.post("/room-bookings", payload);
export const getRooms = (params) => http.get("/rooms", { params });
export const updateRoomRecord = (id, payload) => http.put(`/rooms/${id}`, payload);
export const deleteRoomRecord = (id) => http.delete(`/rooms/${id}`);
export const getRoomBookings = () => http.get("/room-bookings");
export const getMyRoomBookings = () => http.get("/room-bookings/my");
export const updateRoomBooking = (id, payload) => http.put(`/room-bookings/${id}`, payload);
export const deleteRoomBooking = (id) => http.delete(`/room-bookings/${id}`);
