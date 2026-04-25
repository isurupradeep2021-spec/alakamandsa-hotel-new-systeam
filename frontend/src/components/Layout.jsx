import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuByRole = {
  SUPER_ADMIN: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/rooms", label: "Room Management" },
    { to: "/staff", label: "User Management" },
    { to: "/payroll", label: "Payroll System" },
    { to: "/menu-management", label: "Menu Management" },
    { to: "/table-reservations", label: "Table Reservations" },
    { to: "/event-management", label: "Event Management" },
    { to: '/housekeeping', label: 'Housekeeping' },
    { to: '/maintenance', label: 'Maintenance' },
    { to: '/room-service-staff', label: 'Service Staff' },
    { to: "/profile", label: "My Profile" },
  ],
  MANAGER: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/rooms", label: "Room Management" },
    { to: "/staff", label: "Staff Management" },
    { to: "/payroll", label: "Payroll System" },
    { to: "/menu-management", label: "Menu Management" },
    { to: "/table-reservations", label: "Table Reservations" },
    { to: "/event-management", label: "Event Management" },
    { to: '/housekeeping', label: 'Housekeeping' },
    { to: '/maintenance', label: 'Maintenance' },
    { to: '/room-service-staff', label: 'Service Staff' },
    { to: "/profile", label: "My Profile" },
  ],
  STAFF_MEMBER: [
    { to: "/my-payroll", label: "My Salary" },
    { to: "/profile", label: "My Profile" },
  ],
  HOUSEKEEPER: [
    { to: '/housekeeping', label: 'My Tasks' },
    { to: '/profile', label: 'My Profile' }
  ],
  MAINTENANCE_STAFF: [
    { to: '/maintenance', label: 'My Tickets' },
    { to: '/profile', label: 'My Profile' }
  ],
  CUSTOMER: [
    { to: "/dashboard", label: "Customer Dashboard" },
    { to: "/view-rooms", label: "View Rooms" },
    { to: "/book-room", label: "Book Room" },
    { to: "/dining", label: "Dining" },
    { to: "/reserve-table", label: "Reserve Table" },
    { to: "/event-booking", label: "Book Event" },
    { to: "/profile", label: "My Profile" },
  ],
  RESTAURANT_MANAGER: [
    { to: "/dashboard", label: "Restaurant Dashboard" },
    { to: "/dining", label: "Live Menu View" },
    { to: "/menu-management", label: "Menu Management" },
    { to: "/table-reservations", label: "Table Reservations" },
    { to: "/profile", label: "My Profile" },
  ],
  EVENT_MANAGER: [
    { to: "/dashboard", label: "Event Dashboard" },
    { to: "/event-booking-manager", label: "Event Booking" },
    { to: "/event-management", label: "Event Management" },
    { to: "/profile", label: "My Profile" },
  ],
};

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menu = menuByRole[user?.role] || [];
  const roleLabel = (user?.role || "").replaceAll("_", " ");
  const opsRoles = ["SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER", "EVENT_MANAGER"];
  const isOpsRole = opsRoles.includes(user?.role);
  const isEventModuleRoute = location.pathname.startsWith("/event");
  const isEventManagerContext =
    user?.role === "EVENT_MANAGER" &&
    ["/dashboard", "/profile", "/event-booking-manager", "/event-management"].includes(
      location.pathname
    );

  return (
    <div className={`app-shell ${isOpsRole ? "restaurant-ops-shell" : ""}`}>
      <aside className="sidebar">
        <div>
          <h1>HotelFlow</h1>
          <p className="sub">ALAKAMANDA HOTEL</p>
          <span className="role-badge">Role: {roleLabel}</span>
        </div>
        <nav>
          {menu.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="btn ghost"
          onClick={() => {
            logout();
            navigate("/login");
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
            {isOpsRole && !isEventModuleRoute && !isEventManagerContext && (
              <div className="topbar-tagline">
                <strong>Operations Console</strong>
                <span>Manage payroll, rooms, menu, reservations, and events from one dashboard.</span>
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
