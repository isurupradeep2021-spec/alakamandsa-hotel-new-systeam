export default function EventManagerSummaryCards({ summary }) {
  const cards = [
    {
      label: 'Active Events',
      value: summary.activeEventCount,
      caption: 'Upcoming and ongoing events',
      icon: 'bi-calendar-event'
    },
    {
      label: 'Pending Confirmation',
      value: summary.pendingConfirmationCount,
      caption: 'Inquiry requests to be confirmed',
      icon: 'bi-hourglass-split'
    },
    {
      label: 'Most Popular Hall',
      value: summary.mostPopularHall,
      caption: 'Most frequently booked venue overall',
      icon: 'bi-building-check'
    }
  ];

  return (
    <div className="atelier-summary-grid">
      {cards.map((card) => (
        <article key={card.label} className="atelier-summary-card">
          <div className="atelier-summary-top">
            <i className={`bi ${card.icon}`} />
            <span>{card.label}</span>
          </div>
          <h3>{card.value}</h3>
          <p>{card.caption}</p>
        </article>
      ))}
    </div>
  );
}
