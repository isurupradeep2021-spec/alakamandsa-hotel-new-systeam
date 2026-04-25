import { formatEventCurrency, formatEventDate } from '../../eventBookingUtils';

export default function EventManagerRecordsTable({ rows, loading }) {
  return (
    <section className="atelier-records">
      <div className="atelier-records-head">
        <h3>Latest Records</h3>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading event records...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Event</th>
                <th>Schedule</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="atelier-empty-cell">No event bookings available yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="atelier-record-primary">{row.customerName || '-'}</div>
                      <div className="atelier-record-secondary">{row.hallName || '-'}</div>
                    </td>
                    <td>
                      <div className="atelier-record-primary">{row.customerEmail || '-'}</div>
                      <div className="atelier-record-secondary">{row.customerMobile || '-'}</div>
                    </td>
                    <td>
                      <div className="atelier-record-primary">{row.eventType || '-'}</div>
                      <div className="atelier-record-secondary">{row.packageName || '-'}</div>
                    </td>
                    <td>
                      <div className="atelier-record-primary">{formatEventDate(row.eventDateTime)}</div>
                      <div className="atelier-record-secondary">{row.endDateTime ? `to ${formatEventDate(row.endDateTime)}` : '-'}</div>
                    </td>
                    <td>{row.durationHours ? `${row.durationHours} hrs` : '-'}</td>
                    <td>{row.status || '-'}</td>
                    <td>{formatEventCurrency(row.totalPrice || row.totalCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
