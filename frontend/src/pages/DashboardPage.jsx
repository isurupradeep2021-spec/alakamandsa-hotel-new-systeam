import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../api/service';
import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER' || user?.role === 'RESTAURANT_MANAGER') {
      getDashboardSummary().then((res) => setSummary(res.data)).catch(() => setSummary(null));
    }
  }, [user]);

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MANAGER' && user?.role !== 'RESTAURANT_MANAGER') {
    return (
      <div className="card">
        <h3>Welcome, {user?.role}</h3>
        <p>Your module dashboard is ready.</p>
      </div>
    );
  }

  return (
    <div className="restaurant-page">
      <section className="grid">
        <div className="card stat"><h3>Total Staff</h3><p>{summary?.totalStaff ?? 0}</p></div>
        <div className="card stat"><h3>Total Salary Paid</h3><p>Rs. {Number(summary?.totalSalaryPaid || 0).toLocaleString()}</p></div>
        <div className="card stat"><h3>Payroll Records</h3><p>{summary?.totalPayrollRecords ?? 0}</p></div>
      </section>
      <section className="card">
        <div className="section-head">
          <h3>Restaurant Operations</h3>
        </div>
        <div className="ops-stats-grid">
          <article>
            <strong>Menu</strong>
            <span>Manage dishes, pricing visibility, and media.</span>
            <Link className="btn small" to="/menu-management">Open Menu</Link>
          </article>
          <article>
            <strong>Reservations</strong>
            <span>Track booking flow and update service status.</span>
            <Link className="btn small" to="/table-reservations">Open Reservations</Link>
          </article>
          <article>
            <strong>Live Dining</strong>
            <span>Review customer-facing menu and service cues.</span>
            <Link className="btn small" to="/dining">Open Dining</Link>
          </article>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
