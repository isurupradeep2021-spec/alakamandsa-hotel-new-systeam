import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PayrollPage from "./pages/PayrollPage";
import ProfilePage from "./pages/ProfilePage";
import RoomManagementPage from "./pages/RoomManagementPage";
import StaffPage from "./pages/StaffPage";
import BookRoomPage from "./pages/BookRoomPage";
import ViewRoomsPage from "./pages/ViewRoomsPage";
import DiningPage from "./pages/DiningPage";
import ReserveTablePage from "./pages/ReserveTablePage";
import MenuManagementPage from "./pages/MenuManagementPage";
import TableReservationsPage from "./pages/TableReservationsPage";
import EventManagerBookingPage from "./pages/EventManagerBookingPage";
import EventManagementPage from "./pages/EventManagementPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_ADMIN",
                "MANAGER",
                "RESTAURANT_MANAGER",
                "EVENT_MANAGER",
                "CUSTOMER"
              ]}
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]}>
              <RoomManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view-rooms"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <ViewRoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-room"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <BookRoomPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]}>
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-payroll"
          element={
            <ProtectedRoute allowedRoles={["STAFF_MEMBER"]}>
              <PayrollPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dining"
          element={
            <ProtectedRoute
              allowedRoles={["CUSTOMER", "RESTAURANT_MANAGER", "SUPER_ADMIN", "MANAGER"]}
            >
              <DiningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reserve-table"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <ReserveTablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-management"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"]}>
              <MenuManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-reservations"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"]}>
              <TableReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/reservations" element={<Navigate to="/table-reservations" replace />} />

        <Route
          path="/event-booking-manager"
          element={
            <ProtectedRoute allowedRoles={["EVENT_MANAGER"]}>
              <EventManagerBookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-management"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "EVENT_MANAGER"]}>
              <EventManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-booking"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <EventManagementPage view="booking" />
            </ProtectedRoute>
          }
        />

        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
