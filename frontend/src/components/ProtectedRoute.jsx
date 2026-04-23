import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ allowedRoles, allowedPermissions, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  if (allowedPermissions && !allowedPermissions.every((permission) => (user.permissions || []).includes(permission))) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default ProtectedRoute;
