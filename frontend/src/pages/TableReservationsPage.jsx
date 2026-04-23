import { useEffect, useMemo, useState } from 'react';
import {
  assignReservationTable,
  cancelReservation,
  createReservation,
  getReservations,
  updateReservationStatus
} from '../api/service';
import { useAuth } from '../context/AuthContext';

const statusCycle = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SEATED',
  SEATED: 'COMPLETED',
  COMPLETED: 'COMPLETED'
};

const timelineCapacity = {
  BREAKFAST: 40,
  LUNCH: 60,
  DINNER: 70
};

const emptyBooking = {
  name: '',
  email: '',
  phone: '',
  reservationDate: '',
  mealType: 'LUNCH',
  guestCount: 2,
  seatingPreference: 'INDOOR',
  specialRequests: ''
};

const formatLabel = (value) => value?.replaceAll('_', ' ') || '-';
const statusClass = (status) => `status-pill status-${String(status || '').toLowerCase()}`;

function TableReservationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mealFilter, setMealFilter] = useState('ALL');
  const [sort, setSort] = useState({ key: 'reservationDate', direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [tableDrafts, setTableDrafts] = useState({});

  const isPrivilegedAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const canCancelReservations = (user?.permissions || []).includes('CANCEL_RESERVATIONS') || isPrivilegedAdmin;
  const canCreateReservations = (user?.permissions || []).includes('CREATE_RESERVATIONS') || isPrivilegedAdmin;
  const canAssignTables = (user?.permissions || []).includes('ASSIGN_TABLES')
    || user?.role === 'RESTAURANT_MANAGER'
    || isPrivilegedAdmin;
  const canUpdateStatus = (user?.permissions || []).includes('UPDATE_RESERVATION_STATUS')
    || user?.role === 'RESTAURANT_MANAGER'
    || isPrivilegedAdmin;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getReservations();
      setRows(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const timelineSummary = useMemo(() => {
    const base = {
      BREAKFAST: 0,
      LUNCH: 0,
      DINNER: 0
    };
    rows.forEach((row) => {
      if (row.status !== 'CANCELLED' && base[row.mealType] !== undefined) {
        base[row.mealType] += row.guestCount || 0;
      }
    });
    return base;
  }, [rows]);
  const activeReservations = rows.filter((row) => ['PENDING', 'CONFIRMED', 'SEATED'].includes(row.status)).length;
  const completedReservations = rows.filter((row) => row.status === 'COMPLETED').length;
  const cancelledReservations = rows.filter((row) => row.status === 'CANCELLED').length;

  const filteredSortedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const searchMatched = !q
        || row.name?.toLowerCase().includes(q)
        || row.email?.toLowerCase().includes(q)
        || row.phone?.toLowerCase().includes(q);
      const statusMatched = statusFilter === 'ALL' || row.status === statusFilter;
      const mealMatched = mealFilter === 'ALL' || row.mealType === mealFilter;
      return searchMatched && statusMatched && mealMatched;
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      if (sort.key === 'guestCount') return direction * ((a.guestCount || 0) - (b.guestCount || 0));
      if (sort.key === 'reservationDate') return direction * String(a.reservationDate || '').localeCompare(String(b.reservationDate || ''));
      return direction * String(a[sort.key] || '').localeCompare(String(b[sort.key] || ''));
    });
    return sorted;
  }, [rows, search, statusFilter, mealFilter, sort]);

  const onSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const cycleStatus = async (row) => {
    if (!canUpdateStatus) return;
    if (row.status === 'CANCELLED' || row.status === 'COMPLETED') return;
    setMessage('');
    setError('');
    try {
      await updateReservationStatus(row.id, statusCycle[row.status]);
      setMessage(`Reservation moved to ${statusCycle[row.status]}.`);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update status.');
    }
  };

  const onCancel = async (id) => {
    setMessage('');
    setError('');
    try {
      await cancelReservation(id);
      setMessage('Reservation cancelled.');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to cancel reservation.');
    }
  };

  const onAssignTable = async (id) => {
    if (!canAssignTables) return;
    const assignedTable = (tableDrafts[id] || '').trim();
    if (!assignedTable) {
      setError('Please enter a table identifier.');
      return;
    }
    setMessage('');
    setError('');
    try {
      await assignReservationTable(id, assignedTable);
      setMessage(`Table ${assignedTable} assigned.`);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to assign table.');
    }
  };

  const addBooking = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await createReservation({
        ...bookingForm,
        guestCount: Number(bookingForm.guestCount)
      });
      setShowModal(false);
      setBookingForm(emptyBooking);
      setMessage('Booking added with Pending status.');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to add booking.');
    }
  };

  return (
    <div className="restaurant-page">
      <section className="card restaurant-hero">
        <p className="eyebrow">RESTAURANT CONTROL</p>
        <h3>Table Reservations</h3>
        <p>Track booking flow, assign tables, and move service status with confidence.</p>
        <div className="ops-stats-grid">
          <article><strong>{rows.length}</strong><span>Total Bookings</span></article>
          <article><strong>{activeReservations}</strong><span>Active Service</span></article>
          <article><strong>{completedReservations}</strong><span>Completed</span></article>
          <article><strong>{cancelledReservations}</strong><span>Cancelled</span></article>
        </div>
      </section>

      <section className="card">
      <div className="section-head">
        <h3>Table Reservations</h3>
        {canCreateReservations && (
          <button className="btn small" onClick={() => setShowModal(true)}>Add Booking</button>
        )}
      </div>

      <div className="timeline-grid">
        {Object.entries(timelineCapacity).map(([meal, capacity]) => {
          const current = timelineSummary[meal] || 0;
          const percent = Math.min(100, Math.round((current / capacity) * 100));
          return (
            <article key={meal} className="timeline-card">
              <div className="timeline-head">
                <strong>{formatLabel(meal)}</strong>
                <span>{current} / {capacity}</span>
              </div>
              <div className="timeline-bar">
                <div className="timeline-fill" style={{ width: `${percent}%` }} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="toolbar smart-toolbar">
        <input
          placeholder="Search guest, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SEATED">Seated</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={mealFilter} onChange={(e) => setMealFilter(e.target.value)}>
          <option value="ALL">All Meals</option>
          <option value="BREAKFAST">Breakfast</option>
          <option value="LUNCH">Lunch</option>
          <option value="DINNER">Dinner</option>
        </select>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading reservations...</p>}

      {!loading && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th><button className="sort-btn" onClick={() => onSort('name')}>Guest</button></th>
                <th>Contact</th>
                <th><button className="sort-btn" onClick={() => onSort('reservationDate')}>Date</button></th>
                <th><button className="sort-btn" onClick={() => onSort('mealType')}>Meal</button></th>
                <th><button className="sort-btn" onClick={() => onSort('guestCount')}>Guests</button></th>
                <th>Seating</th>
                <th>Assigned Table</th>
                <th><button className="sort-btn" onClick={() => onSort('status')}>Status</button></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSortedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <div>{row.email}</div>
                    <div>{row.phone}</div>
                  </td>
                  <td>{row.reservationDate}</td>
                  <td>{formatLabel(row.mealType)}</td>
                  <td>{row.guestCount}</td>
                  <td>{formatLabel(row.seatingPreference)}</td>
                  <td>
                    <div className="assign-table-box">
                      <input
                        value={tableDrafts[row.id] ?? row.assignedTable ?? ''}
                        onChange={(e) => setTableDrafts({ ...tableDrafts, [row.id]: e.target.value })}
                        placeholder="Table (e.g. T-12)"
                      />
                      <button className="btn small" onClick={() => onAssignTable(row.id)} disabled={!canAssignTables}>
                        Assign
                      </button>
                    </div>
                  </td>
                  <td><span className={statusClass(row.status)}>{formatLabel(row.status)}</span></td>
                  <td>
                    <button
                      className="btn small"
                      onClick={() => cycleStatus(row)}
                      disabled={row.status === 'COMPLETED' || row.status === 'CANCELLED' || !canUpdateStatus}
                    >
                      Next Status
                    </button>
                    <button
                      className="btn danger small"
                      onClick={() => onCancel(row.id)}
                      disabled={row.status === 'CANCELLED' || !canCancelReservations}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSortedRows.length === 0 && (
                <tr>
                  <td colSpan="9">No reservations match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && canCreateReservations && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-head">
              <h3>Add Reservation</h3>
              <button className="btn ghost small" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <form onSubmit={addBooking}>
              <div className="form-grid">
                <div>
                  <label>Name</label>
                  <input
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    value={bookingForm.reservationDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, reservationDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Meal</label>
                  <select
                    value={bookingForm.mealType}
                    onChange={(e) => setBookingForm({ ...bookingForm, mealType: e.target.value })}
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
                <div>
                  <label>Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={bookingForm.guestCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestCount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Seating</label>
                  <select
                    value={bookingForm.seatingPreference}
                    onChange={(e) => setBookingForm({ ...bookingForm, seatingPreference: e.target.value })}
                  >
                    <option value="INDOOR">Indoor</option>
                    <option value="OUTDOOR">Outdoor</option>
                    <option value="OCEAN_VIEW">Ocean View</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
                <div>
                  <label>Special Requests</label>
                  <input
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn" type="submit">Create Booking</button>
            </form>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}

export default TableReservationsPage;
