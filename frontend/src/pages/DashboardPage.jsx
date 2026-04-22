import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary, getEventBookings } from '../api/service';
import { useAuth } from '../context/AuthContext';

function isSameMonth(date, reference) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [eventRows, setEventRows] = useState([]);
  const [eventError, setEventError] = useState('');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') {
      getDashboardSummary().then((res) => setSummary(res.data)).catch(() => setSummary(null));
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

    return eventRows.reduce((accumulator, row) => {
      const status = (row.status || '').toUpperCase();
      const startDate = row.eventDateTime ? new Date(row.eventDateTime) : null;
      const endDate = row.endDateTime ? new Date(row.endDateTime) : null;
      const hasValidStart = startDate && !Number.isNaN(startDate.getTime());
      const hasValidEnd = endDate && !Number.isNaN(endDate.getTime());
      const amount = Number(row.totalPrice || row.totalCost) || 0;

      if (status === 'INQUIRY') {
        accumulator.pendingConfirmation += 1;
      }

      if (!hasValidStart) {
        return accumulator;
      }

      const isCurrentMonth = isSameMonth(startDate, now);
      const isOngoingToday = hasValidEnd
        ? startDate <= now && endDate >= now && !['CANCELLED', 'COMPLETED'].includes(status)
        : startDate <= now && startDate.toDateString() === now.toDateString() && !['CANCELLED', 'COMPLETED'].includes(status);

      if (isOngoingToday) {
        accumulator.activeEvents += 1;
      }

      if (isCurrentMonth && status === 'CONFIRMED' && startDate > now) {
        accumulator.upcomingEvents += 1;
      }

      if (isCurrentMonth && status === 'COMPLETED') {
        accumulator.completedEvents += 1;
      }

      if (isCurrentMonth && status === 'CANCELLED') {
        accumulator.cancelledEvents += 1;
      }

      if (isCurrentMonth && ['CONFIRMED', 'COMPLETED'].includes(status)) {
        accumulator.totalRevenue += amount;
      }

      return accumulator;
    }, {
      activeEvents: 0,
      upcomingEvents: 0,
      pendingConfirmation: 0,
      completedEvents: 0,
      cancelledEvents: 0,
      totalRevenue: 0
    });
  }, [eventRows]);

  if (user?.role === 'EVENT_MANAGER') {
    return (
      <div className="event-dashboard">
        <div className="event-dashboard-actions">
          <Link to="/event-booking-manager" className="card event-action-card">
            <div className="event-action-icon"><i className="bi bi-calendar-plus" /></div>
            <div>
              <h3>Event Booking</h3>
              <p>Create and prefill new event bookings</p>
            </div>
          </Link>
          <Link to="/event-management" className="card event-action-card">
            <div className="event-action-icon"><i className="bi bi-kanban" /></div>
            <div>
              <h3>Event Management</h3>
              <p>Manage event records, analytics, and updates</p>
            </div>
          </Link>
          <Link to="/profile" className="card event-action-card">
            <div className="event-action-icon"><i className="bi bi-person-circle" /></div>
            <div>
              <h3>My Profile</h3>
              <p>Update account details and password settings</p>
            </div>
          </Link>
        </div>

        {eventError && <div className="inline-error">{eventError}</div>}

        <div className="grid event-dashboard-grid">
          <div className="card stat">
            <h3>Active Events</h3>
            <p>{eventDashboard.activeEvents}</p>
            <small>Ongoing events today</small>
          </div>
          <div className="card stat">
            <h3>Upcoming Events</h3>
            <p>{eventDashboard.upcomingEvents}</p>
            <small>Confirmed events later this month</small>
          </div>
          <div className="card stat">
            <h3>Pending Confirmation</h3>
            <p>{eventDashboard.pendingConfirmation}</p>
            <small>Events currently in inquiry status</small>
          </div>
          <div className="card stat">
            <h3>Completed Events</h3>
            <p>{eventDashboard.completedEvents}</p>
            <small>Completed during this month</small>
          </div>
          <div className="card stat">
            <h3>Cancelled Events</h3>
            <p>{eventDashboard.cancelledEvents}</p>
            <small>Cancelled during this month</small>
          </div>
          <div className="card stat">
            <h3>Total Revenue</h3>
            <p>Rs. {eventDashboard.totalRevenue.toLocaleString()}</p>
            <small>Monthly revenue from confirmed and completed events</small>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MANAGER') {
    return (
      <div className="card">
        <h3>Welcome, {user?.role}</h3>
        <p>Your module dashboard is ready.</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card stat"><h3>Total Staff</h3><p>{summary?.totalStaff ?? 0}</p></div>
      <div className="card stat"><h3>Total Salary Paid</h3><p>Rs. {Number(summary?.totalSalaryPaid || 0).toLocaleString()}</p></div>
      <div className="card stat"><h3>Payroll Records</h3><p>{summary?.totalPayrollRecords ?? 0}</p></div>
    </div>
  );
}

export default DashboardPage;
