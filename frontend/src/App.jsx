import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import PayrollPage from './pages/PayrollPage';
import ProfilePage from './pages/ProfilePage';
import DiningPage from './pages/DiningPage';
import ReserveTablePage from './pages/ReserveTablePage';
import MenuManagementPage from './pages/MenuManagementPage';
import TableReservationsPage from './pages/TableReservationsPage';
import RoomManagementPage from './pages/RoomManagementPage';
import ViewRoomsPage from './pages/ViewRoomsPage';
import StaffPage from './pages/StaffPage';

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
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']}>
              <RoomManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view-rooms"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <ViewRoomsPage />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/dining"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'MANAGER']}>
              <DiningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reserve-table"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <ReserveTablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-management"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'RESTAURANT_MANAGER']}>
              <MenuManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-reservations"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'RESTAURANT_MANAGER']}>
              <TableReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/reservations" element={<Navigate to="/table-reservations" replace />} />

        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
