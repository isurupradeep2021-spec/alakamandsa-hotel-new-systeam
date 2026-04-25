/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  createHousekeepingTask,
  deleteHousekeepingTask,
  getHousekeepingStats,
  getHousekeepingTasks,
  getRoomServiceStaff,
  updateHousekeepingTask,
  updateHousekeepingTaskStatus,
} from '../api/roomService';
import { useAuth } from '../context/AuthContext';

const housekeepingStatuses = ['PENDING', 'IN_PROGRESS', 'CLEANED', 'INSPECTED'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
const roomConditionOptions = ['OCCUPIED', 'CHECKOUT', 'PRE_CHECK_IN'];
const taskTypeOptions = ['CLEANING', 'INSPECTION', 'TURNDOWN'];
const housekeeperStatusOptions = ['IN_PROGRESS', 'CLEANED', 'INSPECTED'];

const initialForm = {
  roomNumber: '',
  floor: '',
  roomCondition: 'OCCUPIED',
  taskType: 'CLEANING',
  status: 'PENDING',
  priority: 'MEDIUM',
  staffId: '',
  deadline: '',
  notes: '',
  cleaningNotes: '',
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

export default function HousekeepingPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitLabel = editingTask ? 'Update Task' : 'Create Task';
  const canManage = ['SUPER_ADMIN', 'MANAGER'].includes(user?.role);
  const isHousekeeper = user?.role === 'HOUSEKEEPER';

  const loadData = () => {
    getHousekeepingTasks()
      .then((res) => setTasks(res.data || []))
      .catch(() => setTasks([]));
    getRoomServiceStaff()
      .then((res) => setStaff(res.data || []))
      .catch(() => setStaff([]));
    getHousekeepingStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (statusFilter && task.status !== statusFilter) return false;
        if (priorityFilter && task.priority !== priorityFilter) return false;
        if (search && !task.roomNumber?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [tasks, statusFilter, priorityFilter, search]
  );

  const openCreate = () => {
    setEditingTask(null);
    setForm(initialForm);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      roomNumber: task.roomNumber || '',
      floor: task.floor ?? '',
      roomCondition: task.roomCondition || 'OCCUPIED',
      taskType: task.taskType || 'CLEANING',
      status: task.status || 'PENDING',
      priority: task.priority || 'MEDIUM',
      staffId: task.staffId ?? '',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      notes: task.notes || '',
      cleaningNotes: task.cleaningNotes || '',
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.roomNumber.trim()) {
      setError('Room number is required.');
      return;
    }
    const payload = {
      roomNumber: form.roomNumber.trim(),
      roomCondition: form.roomCondition,
      taskType: form.taskType,
      status: form.status,
      priority: form.priority,
      notes: form.notes || undefined,
      cleaningNotes: form.cleaningNotes || undefined,
      deadline: form.deadline || undefined,
      floor: toNumber(form.floor),
      staffId: toNumber(form.staffId),
    };
    setSubmitting(true);
    try {
      if (editingTask) {
        await updateHousekeepingTask(editingTask.id, payload);
        setMessage('Task updated successfully.');
      } else {
        await createHousekeepingTask(payload);
        setMessage('Task created successfully.');
      }
      setShowModal(false);
      setEditingTask(null);
      setForm(initialForm);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save housekeeping task.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    if (!globalThis.confirm(`Delete housekeeping task for room ${task.roomNumber}?`)) return;
    setMessage('');
    setError('');
    try {
      await deleteHousekeepingTask(task.id);
      setMessage('Task deleted.');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete housekeeping task.'));
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateHousekeepingTaskStatus(id, status);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update task status.'));
    }
  };

  return (
    <div className="restaurant-page">
      <section className="card restaurant-hero">
        <p className="eyebrow">ROOM OPERATIONS</p>
        <h3>Housekeeping</h3>
        <p>Schedule cleanups, assign staff and monitor inspection progress across all floors.</p>
        <div className="ops-stats-grid">
          <article>
            <strong>{stats?.total ?? tasks.length}</strong>
            <span>Total Tasks</span>
          </article>
          <article>
            <strong>{stats?.pending ?? tasks.filter((t) => t.status === 'PENDING').length}</strong>
            <span>Pending</span>
          </article>
          <article>
            <strong>{tasks.filter((t) => t.status === 'IN_PROGRESS').length}</strong>
            <span>In Progress</span>
          </article>
          <article>
            <strong>{stats?.inspected ?? tasks.filter((t) => t.status === 'INSPECTED').length}</strong>
            <span>Inspected</span>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Task Ledger</h3>
          {canManage && (
            <button className="btn small" onClick={openCreate}>
              New Task
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
            {housekeepingStatuses.map((s) => (
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
        </div>

        {message && <p className="success">{message}</p>}
        {error && !showModal && <p className="error">{error}</p>}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Condition</th>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#7a8ea4' }}>
                    No housekeeping tasks match the current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.roomNumber}</strong>
                      <div style={{ fontSize: '12px', color: '#7a8ea4' }}>
                        Floor {task.floor ?? '-'}
                      </div>
                    </td>
                    <td>{formatLabel(task.roomCondition)}</td>
                    <td>{formatLabel(task.taskType)}</td>
                    <td>
                      <StatusPill value={task.status} />
                    </td>
                    <td>
                      <StatusPill value={task.priority} />
                    </td>
                    <td>{task.staff?.fullName || 'Unassigned'}</td>
                    <td>{formatDateTime(task.deadline)}</td>
                    <td>
                      <div className="table-actions">
                        {canManage && (
                          <>
                            <button
                              className="btn small"
                              onClick={() => openEdit(task)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn danger small"
                              onClick={() => handleDelete(task)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {isHousekeeper && (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            style={{ fontSize: '13px', padding: '5px 8px', borderRadius: '8px' }}
                          >
                            {housekeeperStatusOptions.map((s) => (
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
              <h3>{editingTask ? 'Update Task' : 'Create Housekeeping Task'}</h3>
              <button className="btn ghost small" onClick={closeModal}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label htmlFor="hk-room-number">Room Number</label>
                  <input
                    id="hk-room-number"
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="hk-floor">Floor</label>
                  <input
                    id="hk-floor"
                    type="number"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="hk-room-condition">Room Condition</label>
                  <select
                    id="hk-room-condition"
                    value={form.roomCondition}
                    onChange={(e) => setForm({ ...form, roomCondition: e.target.value })}
                  >
                    {roomConditionOptions.map((o) => (
                      <option key={o} value={o}>
                        {formatLabel(o)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hk-task-type">Task Type</label>
                  <select
                    id="hk-task-type"
                    value={form.taskType}
                    onChange={(e) => setForm({ ...form, taskType: e.target.value })}
                  >
                    {taskTypeOptions.map((o) => (
                      <option key={o} value={o}>
                        {formatLabel(o)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hk-status">Status</label>
                  <select
                    id="hk-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {housekeepingStatuses.map((o) => (
                      <option key={o} value={o}>
                        {formatLabel(o)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hk-priority">Priority</label>
                  <select
                    id="hk-priority"
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
                  <label htmlFor="hk-staff">Assigned Staff</label>
                  <select
                    id="hk-staff"
                    value={form.staffId}
                    onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {staff
                      .filter((m) => m.role === 'HOUSEKEEPER')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hk-deadline">Deadline</label>
                  <input
                    id="hk-deadline"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div className="span-full">
                  <label htmlFor="hk-notes">Task Notes</label>
                  <textarea
                    id="hk-notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="span-full">
                  <label htmlFor="hk-cleaning-notes">Cleaning Notes</label>
                  <textarea
                    id="hk-cleaning-notes"
                    value={form.cleaningNotes}
                    onChange={(e) => setForm({ ...form, cleaningNotes: e.target.value })}
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
