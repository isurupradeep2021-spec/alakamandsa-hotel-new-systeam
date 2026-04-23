import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary, getEventBookings, getRooms } from '../api/service';
import { useAuth } from '../context/AuthContext';

function isSameMonth(date, reference) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [eventRows, setEventRows] = useState([]);
  const [eventError, setEventError] = useState('');

  useEffect(() => {
    if (["SUPER_ADMIN", "MANAGER", "RESTAURANT_MANAGER"].includes(user?.role)) {
      getDashboardSummary()
        .then((res) => setSummary(res.data))
        .catch(() => setSummary(null));
    } else if (user?.role === "CUSTOMER") {
      getRooms()
        .then((res) => setRooms(res.data || []))
        .catch(() => setRooms([]));
    }

    if (user?.role === 'CUSTOMER') {
      getRooms().then((res) => setRooms(res.data || [])).catch(() => setRooms([]));
    }

    if (user?.role === 'EVENT_MANAGER') {
      getEventBookings()
        .then((res) => {
          setEventRows(res.data || []);
          setEventError('');
        })
        .catch((error) => {
          setEventRows([]);
          setEventError(error.response?.data?.message || error.message || 'Failed to load event dashboard data');
        });
    }
  }, [user]);

  const eventDashboard = useMemo(() => {
    const now = new Date();

    return eventRows.reduce(
      (accumulator, row) => {
        const status = (row.status || '').toUpperCase();
        const startDate = row.eventDateTime ? new Date(row.eventDateTime) : null;
        const endDate = row.endDateTime ? new Date(row.endDateTime) : null;
        const hasValidStart = startDate && !Number.isNaN(startDate.getTime());
        const hasValidEnd = endDate && !Number.isNaN(endDate.getTime());
        const amount = Number(row.totalPrice || row.totalCost) || 0;

        if (status === 'INQUIRY') accumulator.pendingConfirmation += 1;
        if (!hasValidStart) return accumulator;

        const isCurrentMonth = isSameMonth(startDate, now);
        const isOngoingToday = hasValidEnd
          ? startDate <= now && endDate >= now && !['CANCELLED', 'COMPLETED'].includes(status)
          : startDate <= now && startDate.toDateString() === now.toDateString() && !['CANCELLED', 'COMPLETED'].includes(status);

        if (isOngoingToday) accumulator.activeEvents += 1;
        if (isCurrentMonth && status === 'CONFIRMED' && startDate > now) accumulator.upcomingEvents += 1;
        if (isCurrentMonth && status === 'COMPLETED') accumulator.completedEvents += 1;
        if (isCurrentMonth && status === 'CANCELLED') accumulator.cancelledEvents += 1;
        if (isCurrentMonth && ['CONFIRMED', 'COMPLETED'].includes(status)) accumulator.totalRevenue += amount;

        return accumulator;
      },
      {
        activeEvents: 0,
        upcomingEvents: 0,
        pendingConfirmation: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        totalRevenue: 0
      }
    );
  }, [eventRows]);

  const mostBookedRooms = summary?.mostBookedRooms || [];
  const leastBookedRooms = summary?.leastBookedRooms || [];
  const maxMostBookedCount = Math.max(...mostBookedRooms.map((item) => Number(item.bookings || 0)), 1);
  const maxLeastBookedCount = Math.max(...leastBookedRooms.map((item) => Number(item.bookings || 0)), 1);
  const availableRooms = rooms.filter(
    (room) => room.roomStatus === 'AVAILABLE' && (Number(room.remainingRooms ?? 0) > 0 || room.remainingRooms == null)
  );

  const roomAvailabilityLabel = (room) => {
    const remainingRooms = Number(room.remainingRooms ?? 0);
    if (room.roomStatus !== 'AVAILABLE') return 'Currently unavailable';
    if (remainingRooms > 0) return remainingRooms === 1 ? 'Available now' : `${remainingRooms} rooms available`;
    return 'Available now';
  };

  if (user?.role === 'EVENT_MANAGER') {
    return (
      <div className="event-dashboard">
        <div className="event-dashboard-actions">
          <Link to="/event-booking-manager" className="card event-action-card">
            <div className="event-action-icon"><i className="bi bi-calendar-plus" /></div>
            <div><h3>Event Booking</h3><p>Create and prefill new event bookings</p></div>
          </Link>
          <Link to="/event-management" className="card event-action-card">
            <div className="event-action-icon"><i className="bi bi-kanban" /></div>
            <div><h3>Event Management</h3><p>Manage event records, analytics, and updates</p></div>
          </Link>
          <Link to="/profile" className="card event-action-card">
            <div className="event-action-icon"><i className="bi bi-person-circle" /></div>
            <div><h3>My Profile</h3><p>Update account details and password settings</p></div>
          </Link>
        </div>

        {eventError && <div className="inline-error">{eventError}</div>}

        <div className="grid event-dashboard-grid">
          <div className="card stat"><h3>Active Events</h3><p>{eventDashboard.activeEvents}</p><small>Ongoing events today</small></div>
          <div className="card stat"><h3>Upcoming Events</h3><p>{eventDashboard.upcomingEvents}</p><small>Confirmed events later this month</small></div>
          <div className="card stat"><h3>Pending Confirmation</h3><p>{eventDashboard.pendingConfirmation}</p><small>Events currently in inquiry status</small></div>
          <div className="card stat"><h3>Completed Events</h3><p>{eventDashboard.completedEvents}</p><small>Completed during this month</small></div>
          <div className="card stat"><h3>Cancelled Events</h3><p>{eventDashboard.cancelledEvents}</p><small>Cancelled during this month</small></div>
          <div className="card stat"><h3>Total Revenue</h3><p>Rs. {eventDashboard.totalRevenue.toLocaleString()}</p><small>Monthly revenue from confirmed and completed events</small></div>
        </div>
      </div>
    );
  }

  if (user?.role === "RESTAURANT_MANAGER") {
    return (
      <div className="restaurant-page">
        <section className="grid">
          <div className="card stat"><h3>Total Staff</h3><p>{summary?.totalStaff ?? 0}</p></div>
          <div className="card stat"><h3>Total Salary Paid</h3><p>Rs. {Number(summary?.totalSalaryPaid || 0).toLocaleString()}</p></div>
          <div className="card stat"><h3>Payroll Records</h3><p>{summary?.totalPayrollRecords ?? 0}</p></div>
        </section>
        <section className="card">
          <div className="section-head"><h3>Restaurant Operations</h3></div>
          <div className="ops-stats-grid">
            <article><strong>Menu</strong><span>Manage dishes, pricing visibility, and media.</span><Link className="btn small" to="/menu-management">Open Menu</Link></article>
            <article><strong>Reservations</strong><span>Track booking flow and update service status.</span><Link className="btn small" to="/table-reservations">Open Reservations</Link></article>
            <article><strong>Live Dining</strong><span>Review customer-facing menu and service cues.</span><Link className="btn small" to="/dining">Open Dining</Link></article>
          </div>
        </section>
      </div>
    );
  }

  if (user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') {
    return (
      <div className="grid">
        <div className="card stat room-stat-card"><h3>Payroll Records</h3><p>{summary?.totalPayrollRecords ?? 0}</p></div>
        <div className="card stat"><h3>Total Staff</h3><p>{summary?.totalStaff ?? 0}</p></div>
        <div className="card stat"><h3>Total Salary Paid</h3><p>Rs. {Number(summary?.totalSalaryPaid || 0).toLocaleString()}</p></div>
        <div className="card room-insights-card">
          <h3>Room Booking Insights</h3>
          <p className="room-insights-subtitle">A quick pulse on where demand is strongest and where capacity is underused.</p>
          <div className="insight-creative-grid">
            <section className="insight-creative-card hot">
              <div className="insight-creative-head"><h4>Most Booked Rooms</h4><span className="insight-chip">High Demand</span></div>
              {mostBookedRooms.length > 0 ? (
                <ul className="insight-creative-list">
                  {mostBookedRooms.map((item, index) => (
                    <li key={`most-room-${item.roomNumber}-${index}`}>
                      <div className="insight-room-line"><strong>Room {item.roomNumber}</strong><small>{item.bookings} booking{item.bookings === 1 ? '' : 's'}</small></div>
                      <div className="insight-meter"><span style={{ width: `${Math.max(8, (Number(item.bookings || 0) / maxMostBookedCount) * 100)}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="insight-empty-text">No bookings yet.</p>}
            </section>
            <section className="insight-creative-card cool">
              <div className="insight-creative-head"><h4>Least Booked Rooms</h4><span className="insight-chip">Opportunity</span></div>
              {leastBookedRooms.length > 0 ? (
                <ul className="insight-creative-list">
                  {leastBookedRooms.map((item, index) => (
                    <li key={`least-room-${item.roomNumber}-${index}`}>
                      <div className="insight-room-line"><strong>Room {item.roomNumber}</strong><small>{item.bookings} booking{item.bookings === 1 ? '' : 's'}</small></div>
                      <div className="insight-meter"><span style={{ width: `${Math.max(8, (Number(item.bookings || 0) / maxLeastBookedCount) * 100)}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="insight-empty-text">No bookings yet.</p>}
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') {
    return (
      <section className="card customer-availability-panel">
        <div className="customer-availability-header">
          <div><p className="eyebrow">Live availability</p><h3>Customer Dashboard</h3><p>Quickly see which rooms are open right now and move straight to booking.</p></div>
          <div className="availability-pulse">Updated live</div>
        </div>

        <div className="availability-summary-strip">
          <article><strong>{availableRooms.length}</strong><span>Rooms available</span></article>
          <article><strong>{rooms.length}</strong><span>Total rooms listed</span></article>
          <article><strong>{Math.max(rooms.length - availableRooms.length, 0)}</strong><span>Currently unavailable</span></article>
        </div>

        <div className="availability-card-grid">
          {availableRooms.length > 0 ? (
            availableRooms.slice(0, 6).map((room) => (
              <article key={room.id} className="availability-card">
                <div className="availability-card-top"><strong>Room {room.roomNumber}</strong><span className="availability-badge success">Available</span></div>
                <p>{room.roomType ? `${room.roomType.charAt(0)}${room.roomType.slice(1).toLowerCase()}` : 'Room'}</p>
                <small>{roomAvailabilityLabel(room)}</small>
              </article>
            ))
          ) : (
            <div className="availability-empty"><p>No rooms are currently available.</p></div>
          )}
        </div>

        <div className="availability-actions">
          <Link className="btn small availability-cta" to="/view-rooms">Browse Rooms</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="card">
      <h3>Welcome, {user?.role}</h3>
      <p>Your module dashboard is ready.</p>
    </div>
  );
}

export default DashboardPage;
