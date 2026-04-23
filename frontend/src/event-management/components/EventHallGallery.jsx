import { eventHalls } from '../../eventHallsData';
import { formatEventCurrency } from '../../eventBookingUtils';

export default function EventHallGallery({ onSelectHall }) {
  return (
    <section className="event-hall-gallery card">
      <div className="event-section-head">
        <div>
          <p className="event-panel-eyebrow">Venue Collection</p>
          <h3>Available Event Halls</h3>
        </div>
        <p>Choose a venue to prefill the event booking form.</p>
      </div>

      <div className="hall-grid">
        {eventHalls.map((hall) => (
          <article className="hall-card" key={hall.name}>
            <div className="hall-image">
              <img
                src={hall.image}
                alt={hall.name}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <span className="event-hall-badge">{hall.type}</span>
            </div>
            <div className="hall-info">
              <h4>{hall.name}</h4>
              <p>{hall.description}</p>
              <p>Capacity: {hall.capacity}</p>
              <p className="price">{formatEventCurrency(hall.price_per_hour)} / hour</p>
              <button type="button" className="btn primary" onClick={() => onSelectHall(hall)}>
                Use This Hall
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
