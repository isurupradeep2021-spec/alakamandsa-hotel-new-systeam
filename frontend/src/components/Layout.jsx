import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuByRole = {
  SUPER_ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/staff', label: 'User Management' },
    { to: '/payroll', label: 'Payroll System' },
    { to: '/menu-management', label: 'Menu Management' },
    { to: '/table-reservations', label: 'Table Reservations' },
    { to: '/profile', label: 'My Profile' }
  ],
  MANAGER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/staff', label: 'Staff Management' },
    { to: '/payroll', label: 'Payroll System' },
    { to: '/menu-management', label: 'Menu Management' },
    { to: '/table-reservations', label: 'Table Reservations' },
    { to: '/profile', label: 'My Profile' }
  ],
  STAFF_MEMBER: [{ to: '/my-payroll', label: 'My Salary' }, { to: '/profile', label: 'My Profile' }],
  CUSTOMER: [
    { to: '/dining', label: 'Dining' },
    { to: '/reserve-table', label: 'Reserve Table' },
    { to: '/profile', label: 'My Profile' }
  ],
  RESTAURANT_MANAGER: [
    { to: '/dashboard', label: 'Restaurant Dashboard' },
    { to: '/dining', label: 'Live Menu View' },
    { to: '/table-reservations', label: 'Table Reservations' },
    { to: '/profile', label: 'My Profile' }
  ],
  EVENT_MANAGER: [{ to: '/dashboard', label: 'Event Dashboard' }, { to: '/profile', label: 'My Profile' }]
};

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = menuByRole[user?.role] || [];
  const roleLabel = (user?.role || '').replaceAll('_', ' ');
  const restaurantOpsRoles = ['SUPER_ADMIN', 'MANAGER', 'RESTAURANT_MANAGER'];
  const isRestaurantOpsRole = restaurantOpsRoles.includes(user?.role);

  return (
    <div className={`app-shell ${isRestaurantOpsRole ? 'restaurant-ops-shell' : ''}`}>
      <aside className="sidebar">
        <div>
          <h1>HotelFlow</h1>
          <p className="sub">ALAKAMANDA HOTEL</p>
          <span className="role-badge">Role: {roleLabel}</span>
        </div>
        <nav>
          {menu.map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
        </nav>
        <button
          className="btn ghost"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-content">
            <div>
              <h2>{user?.fullName}</h2>
              <p>{roleLabel}</p>
            </div>
            {isRestaurantOpsRole && (
              <div className="topbar-tagline">
                <strong>Restaurant Operations Console</strong>
                <span>Professional workflow for menu, reservations, and live dining.</span>
              </div>
            )}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
