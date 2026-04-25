import { formatEventCurrency } from '../../eventBookingUtils';

function SummaryCard({ icon, label, value, caption }) {
  return (
    <article className="card stat event-stat-card">
      <div className="event-stat-icon">
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <h3>{label}</h3>
        <p>{value}</p>
        <small>{caption}</small>
      </div>
    </article>
  );
}

export default function EventSummaryCards({ canManageEventRecords, summary }) {
  return (
    <div className="grid event-summary-grid">
      <SummaryCard
        icon="bi-calendar-event"
        label="Total Bookings"
        value={summary.totalEvents}
        caption="All event records created in the system by you"
      />
      <SummaryCard
        icon="bi-calendar-check"
        label="Active Events"
        value={summary.activeEventCount}
        caption="Upcoming and ongoing event bookings"
      />
      <SummaryCard
        icon="bi-hourglass-split"
        label="Pending Inquiry"
        value={summary.pendingConfirmationCount}
        caption="Bookings waiting for confirmation"
      />
      <SummaryCard
        icon={canManageEventRecords ? 'bi-cash-stack' : 'bi-building-check'}
        label={canManageEventRecords ? 'Revenue This Month' : 'Popular Hall'}
        value={canManageEventRecords ? formatEventCurrency(summary.currentMonthEventRevenue) : summary.mostPopularHall}
        caption={canManageEventRecords ? 'Confirmed and completed revenue this month' : 'Most booked venue'}
      />
    </div>
  );
}
