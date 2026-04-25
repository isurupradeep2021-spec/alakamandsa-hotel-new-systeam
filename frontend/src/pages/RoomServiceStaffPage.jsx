/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  createRoomServiceStaff,
  deleteRoomServiceStaff,
  getRoomServiceStaff,
  updateRoomServiceStaff,
} from '../api/roomService';

const staffRoleOptions = ['HOUSEKEEPER', 'MAINTENANCE_STAFF'];

const initialForm = {
  fullName: '',
  username: '',
  password: '',
  role: 'HOUSEKEEPER',
  position: '',
  basicSalary: '',
  dailyRate: '',
  overtimeRate: '',
};

const formatLabel = (value) => (value ? value.replaceAll('_', ' ') : '-');

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function StatusPill({ value }) {
  const key = (value || '').toLowerCase().replaceAll('_', '-');
  return <span className={`status-pill rs-status-${key}`}>{formatLabel(value)}</span>;
}

export default function RoomServiceStaffPage({ embedded = false }) {
  const [staff, setStaff] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = () => {
    getRoomServiceStaff()
      .then((res) => setStaff(res.data || []))
      .catch(() => setStaff([]));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = useMemo(
    () =>
      staff.filter((member) => {
        if (roleFilter && member.role !== roleFilter) return false;
        if (search && !member.fullName?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [staff, roleFilter, search]
  );

  const submitLabel = editingMember ? 'Update Staff Member' : 'Add Staff Member';
  const housekeepers = staff.filter((m) => m.role === 'HOUSEKEEPER').length;
  const maintenanceCount = staff.filter((m) => m.role === 'MAINTENANCE_STAFF').length;

  const openCreate = () => {
    setEditingMember(null);
    setForm(initialForm);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setForm({
      fullName: member.fullName || '',
      username: member.username || '',
      password: '',
      role: member.role || 'HOUSEKEEPER',
      position: member.staffDetail?.position || '',
      basicSalary: member.staffDetail?.basicSalary ?? '',
      dailyRate: member.staffDetail?.dailyRate ?? '',
      overtimeRate: member.staffDetail?.overtimeRate ?? '',
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!editingMember && (!form.username.trim() || !form.password.trim())) {
      setError('Username and password are required when creating a new staff member.');
      return;
    }
    setSubmitting(true);
    const basePayload = {
      fullName: form.fullName.trim(),
      role: form.role,
      position: form.position || undefined,
      basicSalary: form.basicSalary === '' ? undefined : Number(form.basicSalary),
      dailyRate: form.dailyRate === '' ? undefined : Number(form.dailyRate),
      overtimeRate: form.overtimeRate === '' ? undefined : Number(form.overtimeRate),
    };
    try {
      if (editingMember) {
        await updateRoomServiceStaff(editingMember.id, basePayload);
        setMessage('Staff member updated successfully.');
      } else {
        await createRoomServiceStaff({
          ...basePayload,
          username: form.username.trim(),
          password: form.password,
        });
        setMessage('Staff member created successfully.');
      }
      setShowModal(false);
      setEditingMember(null);
      setForm(initialForm);
      loadStaff();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save staff member.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member) => {
    if (!globalThis.confirm(`Delete staff member ${member.fullName}?`)) return;
    setMessage('');
    setError('');
    try {
      await deleteRoomServiceStaff(member.id);
      setMessage('Staff member deleted.');
      loadStaff();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete staff member.'));
    }
  };

  return (
    <div className={embedded ? undefined : 'restaurant-page'}>
      {!embedded && (
        <section className="card restaurant-hero">
          <p className="eyebrow">ROOM OPERATIONS</p>
          <h3>Staff</h3>
          <p>Manage the dedicated room-service team roster including housekeepers and maintenance staff.</p>
        <div className="ops-stats-grid">
          <article>
            <strong>{staff.length}</strong>
            <span>Total Staff</span>
          </article>
          <article>
            <strong>{housekeepers}</strong>
            <span>Housekeepers</span>
          </article>
          <article>
            <strong>{maintenanceCount}</strong>
            <span>Maintenance Staff</span>
          </article>
        </div>
      </section>
      )}

      <section className="card">
        <div className="section-head">
          <h3>Staff Directory</h3>
          <button className="btn small" onClick={openCreate}>
            Add Staff Member
          </button>
        </div>

        <div className="toolbar smart-toolbar">
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {staffRoleOptions.map((r) => (
              <option key={r} value={r}>
                {formatLabel(r)}
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
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Position</th>
                <th>Basic Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#7a8ea4' }}>
                    No room-service staff members match the current filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.fullName}</strong>
                    </td>
                    <td>{member.username || '-'}</td>
                    <td>
                      <StatusPill value={member.role} />
                    </td>
                    <td>{member.staffDetail?.position || '-'}</td>
                    <td>{member.staffDetail?.basicSalary != null ? `Rs. ${Number(member.staffDetail.basicSalary).toFixed(2)}` : '-'}</td>
                    <td>
                      <StatusPill value={member.staffDetail?.status || 'ACTIVE'} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn small" onClick={() => openEdit(member)}>
                          Edit
                        </button>
                        <button
                          className="btn danger small"
                          onClick={() => handleDelete(member)}
                        >
                          Delete
                        </button>
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
              <h3>{editingMember ? 'Update Staff Member' : 'Add Staff Member'}</h3>
              <button className="btn ghost small" onClick={closeModal}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label htmlFor="rss-full-name">Full Name</label>
                  <input
                    id="rss-full-name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="rss-role">Role</label>
                  <select
                    id="rss-role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {staffRoleOptions.map((r) => (
                      <option key={r} value={r}>
                        {formatLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
                {!editingMember && (
                  <>
                    <div>
                      <label htmlFor="rss-username">Username</label>
                      <input
                        id="rss-username"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="rss-password">Password</label>
                      <input
                        id="rss-password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="rss-position">Position</label>
                  <input
                    id="rss-position"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="e.g. Cleaner, Technician"
                  />
                </div>
                <div>
                  <label htmlFor="rss-salary">Basic Salary (Rs.)</label>
                  <input
                    id="rss-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basicSalary}
                    onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="rss-daily-rate">Daily Rate (Rs.)</label>
                  <input
                    id="rss-daily-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="rss-overtime-rate">Overtime Rate (Rs.)</label>
                  <input
                    id="rss-overtime-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.overtimeRate}
                    onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })}
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
