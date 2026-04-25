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
export const exportPayrollCsv = (params) =>
  http.get("/payroll/export/csv", { params, responseType: "blob" });
export const exportPayrollPdf = (params) =>
  http.get("/payroll/export/pdf", { params, responseType: "blob" });

export const getMyProfile = () => http.get("/users/me");
export const updateMyProfile = (payload) => http.put("/users/me", payload);
export const changeMyPassword = (payload) => http.post("/users/me/change-password", payload);

export const createRoomRecord = (payload) => http.post("/rooms", payload);
export const getRooms = (params) => http.get("/rooms", { params });
export const updateRoomRecord = (id, payload) => http.put(`/rooms/${id}`, payload);
export const deleteRoomRecord = (id) => http.delete(`/rooms/${id}`);

export const createRoomBooking = (payload) => http.post("/room-bookings", payload);
export const getRoomBookings = () => http.get("/room-bookings");
export const getMyRoomBookings = () => http.get("/room-bookings/my");
export const updateRoomBooking = (id, payload) => http.put(`/room-bookings/${id}`, payload);
export const deleteRoomBooking = (id) => http.delete(`/room-bookings/${id}`);
export const requestRoomBookingCancellation = (id) =>
  http.patch(`/room-bookings/${id}/request-cancellation`);
export const approveRoomBookingCancellation = (id) =>
  http.patch(`/room-bookings/${id}/approve-cancellation`);
export const checkRoomAvailability = (roomNumber, checkInDate, checkOutDate) =>
  http.get("/room-bookings/check-availability", {
    params: { roomNumber, checkInDate, checkOutDate },
  });

export const createReservation = (payload) => http.post("/reservations", payload);
export const getReservations = () => http.get("/reservations");
export const getMyReservations = () => http.get("/reservations/my");
export const updateReservationStatus = (id, status) =>
  http.patch(`/reservations/${id}/status`, { status });
export const assignReservationTable = (id, assignedTable) =>
  http.patch(`/reservations/${id}/assign-table`, { assignedTable });
export const cancelReservation = (id) => http.post(`/reservations/${id}/cancel`);

export const getMenuItems = (params) => http.get("/menu-items", { params });
export const createMenuItem = (payload) => http.post("/menu-items", payload);
export const updateMenuItem = (id, payload) => http.put(`/menu-items/${id}`, payload);
export const toggleMenuItemAvailability = (id, available) =>
  http.patch(`/menu-items/${id}/availability`, null, { params: { available } });
export const uploadMenuItemImage = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return http.post(`/menu-items/${id}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deleteMenuItem = (id) => http.delete(`/menu-items/${id}`);

export const getEventBookings = () => http.get("/event-bookings");
export const createEventBooking = (payload) => http.post("/event-bookings", payload);
export const updateEventBooking = (id, payload) => http.put(`/event-bookings/${id}`, payload);
export const deleteEventBooking = (id) => http.delete(`/event-bookings/${id}`);
export const eventAnalytics = () => http.get("/event-bookings/analytics");
export const downloadEventBookingPdf = (id) =>
  http.get(`/event-bookings/${id}/pdf`, { responseType: "blob" });
