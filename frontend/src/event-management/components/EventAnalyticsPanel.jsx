import { getTopEventType } from '../../eventBookingUtils';

export default function EventAnalyticsPanel({ analytics }) {
  const topType = getTopEventType(analytics?.popularTypes);

  return (
    <section className="card event-analytics-panel">
      <div className="event-analytics-head">
        <div>
          <p className="event-panel-eyebrow">Management Insight</p>
          <h3>Booking Analytics</h3>
        </div>
        <span className="event-panel-chip">
          <i className="bi bi-bar-chart-line" />
          Live totals
        </span>
      </div>

      <div className="event-analytics-grid">
        <div>
          <small>Total Recorded Events</small>
          <strong>{analytics?.events ?? 0}</strong>
        </div>
        <div>
          <small>Most Popular Event Type</small>
          <strong>{topType.label}</strong>
        </div>
        <div>
          <small>Bookings for Top Type</small>
          <strong>{topType.count}</strong>
        </div>
      </div>
    </section>
  );
}
