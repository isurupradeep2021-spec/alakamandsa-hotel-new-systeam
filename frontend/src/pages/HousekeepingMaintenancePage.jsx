import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import HousekeepingPage from './HousekeepingPage';
import MaintenancePage from './MaintenancePage';
import RoomServiceStaffPage from './RoomServiceStaffPage';
import OperationalAnalyticsPage from './OperationalAnalyticsPage';
import { useAuth } from '../context/AuthContext';

const tabsByRole = {
  SUPER_ADMIN: [
    { to: 'housekeeping-tickets', label: 'Housekeeping Tickets' },
    { to: 'maintenance-tickets', label: 'Maintenance Tickets' },
    { to: 'staff', label: 'Staff' },
    { to: 'analytics', label: 'Analytics' },
  ],
  MANAGER: [
    { to: 'housekeeping-tickets', label: 'Housekeeping Tickets' },
    { to: 'maintenance-tickets', label: 'Maintenance Tickets' },
    { to: 'staff', label: 'Staff' },
    { to: 'analytics', label: 'Analytics' },
  ],
  HOUSEKEEPER: [
    { to: 'housekeeping-tickets', label: 'Housekeeping Tickets' },
  ],
  MAINTENANCE_STAFF: [
    { to: 'maintenance-tickets', label: 'Maintenance Tickets' },
  ],
};

export default function HousekeepingMaintenancePage() {
  const { user } = useAuth();
  const tabs = tabsByRole[user?.role] || [];

  // Default sub-route per role
  const defaultTab = tabs[0]?.to ?? 'housekeeping-tickets';

  return (
    <div className="restaurant-page">
      {/* Panel header */}
      <section className="card restaurant-hero" style={{ paddingBottom: '0' }}>
        <p className="eyebrow">ROOM OPERATIONS</p>
        <h3>Housekeeping &amp; Maintenance</h3>
        <p>Manage housekeeping tasks, maintenance tickets, and room-service team roster.</p>

        {/* Inner tab nav */}
        <nav className="hm-tab-nav">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `hm-tab${isActive ? ' active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </section>

      {/* Sub-page content */}
      <div className="hm-tab-content">
        <Routes>
          <Route index element={<Navigate to={defaultTab} replace />} />
          <Route path="housekeeping-tickets" element={<HousekeepingPage embedded />} />
          <Route path="maintenance-tickets" element={<MaintenancePage embedded />} />
          <Route path="staff" element={<RoomServiceStaffPage embedded />} />
          <Route path="analytics" element={<OperationalAnalyticsPage embedded />} />
          <Route path="*" element={<Navigate to={defaultTab} replace />} />
        </Routes>
      </div>
    </div>
  );
}
