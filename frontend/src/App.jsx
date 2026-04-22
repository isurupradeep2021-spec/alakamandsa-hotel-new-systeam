import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import PayrollPage from './pages/PayrollPage';
import ProfilePage from './pages/ProfilePage';
import StaffPage from './pages/StaffPage';
import EventManagerBookingPage from './pages/EventManagerBookingPage';
import EventManagementPage from './pages/EventManagementPage';

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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']}>
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-payroll"
          element={
            <ProtectedRoute allowedRoles={['STAFF_MEMBER']}>
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/event-booking-manager"
          element={
            <ProtectedRoute allowedRoles={['EVENT_MANAGER']}>
              <EventManagerBookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-management"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER']}>
              <EventManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-booking"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <EventManagementPage view="booking" />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
