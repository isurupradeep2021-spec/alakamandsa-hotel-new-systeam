import { eventHalls } from '../../eventHallsData';
import { formatEventCurrency } from '../../eventBookingUtils';

export default function EventManagerHallGallery({ onSelectHall }) {
  return (
    <section className="atelier-section">
      <div className="atelier-section-head">
        <p className="atelier-eyebrow">Venue Collection</p>
        <h3>Event Hall Listing</h3>
        <p>Browse available venues and prefill the booking form with one click.</p>
      </div>

      <div className="atelier-hall-grid">
        {eventHalls.map((hall) => (
          <article className="atelier-hall-card" key={hall.name}>
            <div className="atelier-hall-image-wrap">
              <img
                src={hall.image}
                alt={hall.name}
                className="atelier-hall-image"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <span className="atelier-hall-badge">{hall.type}</span>
            </div>

            <div className="atelier-hall-content">
              <p className="atelier-card-eyebrow">Event Hall</p>
              <h4>{hall.name}</h4>
              <p className="atelier-hall-description">{hall.description}</p>

              <div className="atelier-hall-meta">
                <span><i className="bi bi-people" /> Capacity: {hall.capacity}</span>
                <span><i className="bi bi-cash-stack" /> {formatEventCurrency(hall.price_per_hour)} / hour</span>
              </div>

              <button type="button" className="btn primary atelier-book-btn" onClick={() => onSelectHall(hall)}>
                Book Now
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
