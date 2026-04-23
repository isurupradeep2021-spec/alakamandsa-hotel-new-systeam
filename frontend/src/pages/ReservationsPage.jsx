import { useEffect, useState } from 'react';
import { getReservations } from '../api/service';

function ReservationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="card">
      <div className="section-head">
        <h3>Reservations List</h3>
        <button className="btn small" onClick={load}>Refresh</button>
      </div>
      {loading && <p>Loading reservations...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Date</th>
                <th>Meal</th>
                <th>Guests</th>
                <th>Seating</th>
                <th>Requests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>
                    <div>{row.email}</div>
                    <div>{row.phone}</div>
                  </td>
                  <td>{row.reservationDate}</td>
                  <td>{row.mealType}</td>
                  <td>{row.guestCount}</td>
                  <td>{row.seatingPreference}</td>
                  <td>{row.specialRequests || '-'}</td>
                  <td><span className="status-pill">{row.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8">No reservations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReservationsPage;
