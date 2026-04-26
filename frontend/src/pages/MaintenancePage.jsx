/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  createMaintenanceTicket,
  deleteMaintenanceTicket,
  getMaintenanceStats,
  getMaintenanceTickets,
  getRooms,
  getRoomServiceStaff,
  updateMaintenanceTicket,
  updateMaintenanceTicketStatus,
} from '../api/roomService';
import { useAuth } from '../context/AuthContext';

const maintenanceStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
const facilityOptions = ['AC', 'PLUMBING', 'ELECTRICAL', 'FURNITURE', 'OTHER'];
const maintenanceStaffStatusOptions = ['IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const initialForm = {
  roomNumber: '',
  facilityType: 'AC',
  issueDescription: '',
  status: 'OPEN',
  priority: 'MEDIUM',
  staffId: '',
  deadline: '',
  resolutionNotes: '',
  partsUsed: '',
};

const formatLabel = (value) => (value ? value.replaceAll('_', ' ') : '-');

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const toNumber = (value) => {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function StatusPill({ value }) {
  const key = (value || '').toLowerCase().replaceAll('_', '-');
  return <span className={`status-pill rs-status-${key}`}>{formatLabel(value)}</span>;
}

export default function MaintenancePage({ embedded = false }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitLabel = editingTicket ? 'Update Ticket' : 'Create Ticket';
  const canManage = ['SUPER_ADMIN', 'MANAGER'].includes(user?.role);
  const isMaintenanceStaff = user?.role === 'MAINTENANCE_STAFF';

  const loadData = () => {
    getMaintenanceTickets()
      .then((res) => setTickets(res.data || []))
      .catch(() => setTickets([]));
    getRoomServiceStaff()
      .then((res) => setStaff(res.data || []))
      .catch(() => setStaff([]));
    getMaintenanceStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
    getRooms()
      .then((res) => setRooms(res.data || []))
      .catch(() => setRooms([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (statusFilter && ticket.status !== statusFilter) return false;
        if (priorityFilter && ticket.priority !== priorityFilter) return false;
        if (facilityFilter && ticket.facilityType !== facilityFilter) return false;
        if (search && !ticket.roomNumber?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [tickets, statusFilter, priorityFilter, facilityFilter, search]
  );

  const openCreate = () => {
    setEditingTicket(null);
    setForm(initialForm);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (ticket) => {
    setEditingTicket(ticket);
    setForm({
      roomNumber: ticket.roomNumber || '',
      facilityType: ticket.facilityType || 'AC',
      issueDescription: ticket.issueDescription || '',
      status: ticket.status || 'OPEN',
      priority: ticket.priority || 'MEDIUM',
      staffId: ticket.staffId ?? '',
      deadline: ticket.deadline ? ticket.deadline.slice(0, 16) : '',
      resolutionNotes: ticket.resolutionNotes || '',
      partsUsed: ticket.partsUsed || '',
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTicket(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.roomNumber || !form.issueDescription.trim()) {
      setError('Please select a room and enter an issue description.');
      return;
    }
    const payload = {
      roomNumber: form.roomNumber,
      facilityType: form.facilityType,
      issueDescription: form.issueDescription.trim(),
      status: form.status,
      priority: form.priority,
      resolutionNotes: form.resolutionNotes || undefined,
      partsUsed: form.partsUsed || undefined,
      deadline: form.deadline || undefined,
      staffId: toNumber(form.staffId),
    };
    setSubmitting(true);
    try {
      if (editingTicket) {
        await updateMaintenanceTicket(editingTicket.id, payload);
        setMessage('Ticket updated successfully.');
      } else {
        await createMaintenanceTicket(payload);
        setMessage('Ticket created successfully.');
      }
      setShowModal(false);
      setEditingTicket(null);
      setForm(initialForm);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save maintenance ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ticket) => {
    if (!globalThis.confirm(`Delete maintenance ticket for room ${ticket.roomNumber}?`)) return;
    setMessage('');
    setError('');
    try {
      await deleteMaintenanceTicket(ticket.id);
      setMessage('Ticket deleted.');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete maintenance ticket.'));
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateMaintenanceTicketStatus(id, status);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update ticket status.'));
    }
  };

  return (
    <div className={embedded ? undefined : 'restaurant-page'}>
      {!embedded && (
        <section className="card restaurant-hero">
          <p className="eyebrow">ROOM OPERATIONS</p>
          <h3>Maintenance Tickets</h3>
          <p>Coordinate room repairs, assign technical staff and track resolution progress.</p>
        <div className="ops-stats-grid">
          <article>
            <strong>{stats?.total ?? tickets.length}</strong>
            <span>Total Tickets</span>
          </article>
          <article>
            <strong>{stats?.open ?? tickets.filter((t) => t.status === 'OPEN').length}</strong>
            <span>Open</span>
          </article>
          <article>
            <strong>{tickets.filter((t) => t.status === 'IN_PROGRESS').length}</strong>
            <span>In Progress</span>
          </article>
          <article>
            <strong>{stats?.resolved ?? tickets.filter((t) => t.status === 'RESOLVED').length}</strong>
            <span>Resolved</span>
          </article>
        </div>
      </section>
      )}

      <section className="card">
        <div className="section-head">
          <h3>Maintenance Pipeline</h3>
          {canManage && (
            <button className="btn small" onClick={openCreate}>
              New Ticket
            </button>
          )}
        </div>

        <div className="toolbar smart-toolbar">
          <input
            placeholder="Search room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {maintenanceStatuses.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {formatLabel(p)}
              </option>
            ))}
          </select>
          <select value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)}>
            <option value="">All Facilities</option>
            {facilityOptions.map((f) => (
              <option key={f} value={f}>
                {formatLabel(f)}
              </option>
            ))}
          </select>
        </div>

        {message && <p className="success">{message}</p>}
        {error && !showModal && <p className="error">{error}</p>}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Facility</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#7a8ea4' }}>
                    No maintenance tickets match the current filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><strong>{ticket.roomNumber}</strong></td>
                    <td>{formatLabel(ticket.facilityType)}</td>
                    <td style={{ maxWidth: '200px' }}>
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                        }}
                        title={ticket.issueDescription}
                      >
                        {ticket.issueDescription || '-'}
                      </div>
                    </td>
                    <td>
                      <StatusPill value={ticket.status} />
                    </td>
                    <td>
                      <StatusPill value={ticket.priority} />
                    </td>
                    <td>{ticket.staff?.fullName || 'Unassigned'}</td>
                    <td>{formatDateTime(ticket.deadline)}</td>
                    <td>
                      <div className="table-actions">
                        {canManage && (
                          <>
                            <button
                              className="btn small"
                              onClick={() => openEdit(ticket)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn danger small"
                              onClick={() => handleDelete(ticket)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {isMaintenanceStaff && (
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            style={{ fontSize: '13px', padding: '5px 8px', borderRadius: '8px' }}
                          >
                            {maintenanceStaffStatusOptions.map((s) => (
                              <option key={s} value={s}>
                                {formatLabel(s)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-head">
              <h3>{editingTicket ? 'Update Ticket' : 'Create Maintenance Ticket'}</h3>
              <button className="btn ghost small" onClick={closeModal}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label htmlFor="mt-room-number">Room</label>
                  <select
                    id="mt-room-number"
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    required
                  >
                    <option value="">Select a room…</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.roomNumber}>
                        Room {r.roomNumber} — {r.roomStatus}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mt-facility">Facility Type</label>
                  <select
                    id="mt-facility"
                    value={form.facilityType}
                    onChange={(e) => setForm({ ...form, facilityType: e.target.value })}
                  >
                    {facilityOptions.map((o) => (
                      <option key={o} value={o}>
                        {formatLabel(o)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mt-status">Status</label>
                  <select
                    id="mt-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {maintenanceStatuses.map((o) => (
                      <option key={o} value={o}>
                        {formatLabel(o)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mt-priority">Priority</label>
                  <select
                    id="mt-priority"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {priorityOptions.map((o) => (
                      <option key={o} value={o}>
                        {formatLabel(o)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mt-staff">Assigned Staff</label>
                  <select
                    id="mt-staff"
                    value={form.staffId}
                    onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {staff
                      .filter((m) => m.role === 'MAINTENANCE_STAFF')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="mt-deadline">Deadline</label>
                  <input
                    id="mt-deadline"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div className="span-full">
                  <label htmlFor="mt-issue">Issue Description</label>
                  <textarea
                    id="mt-issue"
                    value={form.issueDescription}
                    onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="mt-resolution">Resolution Notes</label>
                  <textarea
                    id="mt-resolution"
                    value={form.resolutionNotes}
                    onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="mt-parts">Parts Used</label>
                  <textarea
                    id="mt-parts"
                    value={form.partsUsed}
                    onChange={(e) => setForm({ ...form, partsUsed: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              {error && <p className="error">{error}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Saving...' : submitLabel}
                </button>
                <button type="button" className="btn ghost" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
