import { useEffect, useState } from 'react';
import { createStaff, getStaff, softDeleteStaff, updateStaff } from '../api/service';

const emptyForm = {
  name: '',
  position: '',
  basicSalary: '',
  attendance: 26,
  overtimeHours: 0,
  absentDays: 0,
  overtimeRate: 1000,
  dailyRate: 3000
};

function StaffPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [previewStaff, setPreviewStaff] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await getStaff({ name: search, page: 0, size: 50 });
    setRows(res.data.content || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      basicSalary: Number(form.basicSalary),
      attendance: Number(form.attendance),
      overtimeHours: Number(form.overtimeHours),
      absentDays: Number(form.absentDays),
      overtimeRate: Number(form.overtimeRate),
      dailyRate: Number(form.dailyRate)
    };

    if (editingId) await updateStaff(editingId, payload);
    else await createStaff(payload);

    setMessage(editingId ? 'Staff updated' : 'Staff added');
    setEditingId(null);
    setForm(emptyForm);
    load();
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({ ...r });
    setPreviewStaff(r);
  };

  const remove = async (id) => {
    await softDeleteStaff(id);
    setMessage('Staff soft deleted');
    load();
  };

  return (
    <div className="card">
      <h3>Staff Management</h3>
      <div className="toolbar">
        <input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn" onClick={load}>Search</button>
      </div>

      <form onSubmit={submit}>
        <div className="staff-form-shell">
          <section className="staff-form-panel">
            <h4>Staff Details</h4>
            <div className="form-grid">
              <div>
                <label>Staff Name</label>
                <input
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <small>Example: Nimal Perera</small>
              </div>
              <div>
                <label>Position</label>
                <input
                  placeholder="Enter position/title"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  required
                />
                <small>Example: Reception Staff</small>
              </div>
              <div>
                <label>Basic Salary (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Monthly basic salary"
                  value={form.basicSalary}
                  onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
                  required
                />
                <small>Fixed monthly salary</small>
              </div>
              <div>
                <label>Attendance Days</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  placeholder="Present days"
                  value={form.attendance}
                  onChange={(e) => setForm({ ...form, attendance: e.target.value })}
                  required
                />
                <small>Allowed range: 0-31</small>
              </div>
              <div>
                <label>Overtime Hours</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Total overtime hours"
                  value={form.overtimeHours}
                  onChange={(e) => setForm({ ...form, overtimeHours: e.target.value })}
                  required
                />
                <small>Extra hours worked</small>
              </div>
              <div>
                <label>Absent Days</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Absent days"
                  value={form.absentDays}
                  onChange={(e) => setForm({ ...form, absentDays: e.target.value })}
                  required
                />
                <small>Used for deductions</small>
              </div>
              <div>
                <label>Overtime Rate (Rs./hour)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Overtime pay rate"
                  value={form.overtimeRate}
                  onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })}
                  required
                />
                <small>Per 1 overtime hour</small>
              </div>
              <div>
                <label>Daily Rate (Rs./day)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Absent deduction rate"
                  value={form.dailyRate}
                  onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                  required
                />
                <small>Per 1 absent day</small>
              </div>
            </div>
          </section>

          <aside className="payroll-help-panel">
            <h4>Payroll Formula</h4>
            <p><strong>Overtime Pay</strong> = Overtime Hours x Overtime Rate</p>
            <p><strong>Deductions</strong> = (Absent Days x Daily Rate) + Tax (10%)</p>
            <p><strong>Net Salary</strong> = Basic Salary + Overtime Pay - Deductions</p>
          </aside>
        </div>
        <div className="staff-form-actions">
          <button className="btn" type="submit">{editingId ? 'Update Staff' : 'Add Staff'}</button>
        </div>
      </form>

      {message && <p className="success">{message}</p>}

      <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Position</th><th>Salary</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.position}</td>
              <td>Rs. {Number(r.basicSalary).toLocaleString()}</td>
              <td>{r.status}</td>
              <td>
                <button className="btn small" onClick={() => edit(r)}>Edit</button>
                <button className="btn small" onClick={() => setPreviewStaff(r)}>Calendar</button>
                <button className="btn danger small" onClick={() => remove(r.id)}>Soft Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {previewStaff && (
        <div className="calendar-preview-wrap">
          <h4>
            Attendance Calendar Preview - {previewStaff.name} ({previewStaff.position})
          </h4>
          <div className="calendar-legend">
            <span className="legend-item"><i className="dot present" /> P = Present</span>
            <span className="legend-item"><i className="dot absent" /> A = Absent</span>
            <span className="legend-item"><i className="dot none" /> - = No record</span>
          </div>
          <AttendanceCalendar attendance={Number(previewStaff.attendance || 0)} absentDays={Number(previewStaff.absentDays || 0)} />
        </div>
      )}
    </div>
  );
}

function AttendanceCalendar({ attendance, absentDays }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="attendance-grid">
      {days.map((day) => {
        let label = '-';
        let stateClass = 'state-none';
        if (day <= attendance) {
          label = 'P';
          stateClass = 'state-present';
        } else if (day <= attendance + absentDays) {
          label = 'A';
          stateClass = 'state-absent';
        }
        return (
          <div
            key={day}
            className={`attendance-day ${stateClass}`}
            title={`Day ${day}`}
          >
            {day} {label}
          </div>
        );
      })}
    </div>
  );
}

export default StaffPage;
