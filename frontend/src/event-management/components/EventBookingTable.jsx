import { formatEventCurrency, formatEventDate } from '../../eventBookingUtils';

export default function EventBookingTable({ rows, canManageEventRecords, onEdit, onDelete, loading }) {
  if (loading) {
    return <div className="loading-state"><p>Loading event data...</p></div>;
  }

  if (rows.length === 0) {
    return (
      <section className="event-bookings-table">
        <div className="event-empty-state">
          <i className="bi bi-calendar2-x" />
          <h3>No event bookings found</h3>
          <p>Create a booking or select a venue to start building your event records.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="event-bookings-table">
      <div className="event-section-head">
        <div>
          <p className="event-panel-eyebrow">Booking Records</p>
          <h3>{canManageEventRecords ? 'All Event Bookings' : 'My Event Bookings'}</h3>
        </div>
      </div>

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
              {canManageEventRecords && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="customer-info">
                    <div className="name">{row.customerName || '-'}</div>
                    <div className="email">{row.hallName || '-'}</div>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="email">{row.customerEmail || '-'}</div>
                    <div className="mobile">{row.customerMobile || '-'}</div>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <div className="name">{row.eventType || '-'}</div>
                    <div className="email">{row.packageName || '-'}</div>
                  </div>
                </td>
                <td>
                  <div className="datetime">
                    <div>{formatEventDate(row.eventDateTime)}</div>
                    <div>{row.endDateTime ? `to ${formatEventDate(row.endDateTime)}` : '-'}</div>
                  </div>
                </td>
                <td>{row.durationHours ? `${row.durationHours} hrs` : '-'}</td>
                <td>
                  <span className={`status-badge status-${(row.status || '').toLowerCase()}`}>
                    {row.status || '-'}
                  </span>
                </td>
                <td>{formatEventCurrency(row.totalPrice || row.totalCost)}</td>
                {canManageEventRecords && (
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="btn-icon edit" onClick={() => onEdit(row)} title="Edit" aria-label="Edit booking">
                        <i className="bi bi-pencil" />
                        <span>Edit</span>
                      </button>
                      <button type="button" className="btn-icon delete" onClick={() => onDelete(row)} title="Delete" aria-label="Delete booking">
                        <i className="bi bi-trash" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
