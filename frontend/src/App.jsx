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
                        <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]}>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/rooms"
                    element={
                        <ProtectedRoute allowedRoles={["MANAGER"]}>
                            <RoomManagementPage />
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
                <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;
