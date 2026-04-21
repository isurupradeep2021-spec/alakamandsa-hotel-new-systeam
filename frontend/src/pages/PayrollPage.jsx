import { useEffect, useState } from 'react';
import { calculatePayroll, exportPayrollCsv, exportPayrollPdf, getAllPayroll, getMyPayroll, getStaff } from '../api/service';
import { useAuth } from '../context/AuthContext';

function PayrollPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ staffId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [msg, setMsg] = useState('');

  const isManagerView = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  const load = async () => {
    if (isManagerView) {
      const [staffRes, payrollRes] = await Promise.all([getStaff({ page: 0, size: 100 }), getAllPayroll()]);
      setStaff(staffRes.data.content || []);
      setRows(payrollRes.data || []);
    } else {
      const res = await getMyPayroll();
      setRows(res.data || []);
    }
  };

  useEffect(() => { load(); }, [isManagerView]);

  const calculate = async (e) => {
    e.preventDefault();
    await calculatePayroll({ ...form, staffId: Number(form.staffId), month: Number(form.month), year: Number(form.year) });
    setMsg('Payroll calculated successfully');
    load();
  };

  const downloadCsv = async () => {
    const res = await exportPayrollCsv({ month: form.month, year: form.year });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const res = await exportPayrollPdf({ month: form.month, year: form.year });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h3>{isManagerView ? 'Payroll Management' : 'My Salary Details'}</h3>

      {isManagerView && (
        <form className="toolbar" onSubmit={calculate}>
          <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
            <option value="">Select Staff</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
          <input type="number" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
          <button className="btn" type="submit">Auto Calculate</button>
          <button className="btn ghost" type="button" onClick={downloadCsv}>Export CSV</button>
          <button className="btn ghost" type="button" onClick={downloadPdf}>Export PDF</button>
        </form>
      )}

      {msg && <p className="success">{msg}</p>}

      <table>
        <thead>
          <tr>
            <th>Staff</th><th>Month</th><th>Basic</th><th>Overtime</th><th>Deductions</th><th>Net Salary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.staffName}</td>
              <td>{r.year}-{String(r.month).padStart(2, '0')}</td>
              <td>Rs. {Number(r.basicSalary).toLocaleString()}</td>
              <td>Rs. {Number(r.overtimePay).toLocaleString()}</td>
              <td>Rs. {Number(r.deductions).toLocaleString()}</td>
              <td><strong>Rs. {Number(r.netSalary).toLocaleString()}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PayrollPage;
