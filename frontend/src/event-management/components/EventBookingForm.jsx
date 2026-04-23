import { eventHalls } from '../../eventHallsData';
import { formatEventCurrency } from '../../eventBookingUtils';

export default function EventBookingForm({
  form,
  setField,
  onHallChange,
  onSubmit,
  onReset,
  formError,
  isEditingRecord,
  eventStatusOptions,
  selectedEventHall,
  eventDurationLabel,
  eventTotalPrice,
  canManageEventRecords
}) {
  return (
    <section className="event-booking-form">
      <div className="event-section-head">
        <div>
          <p className="event-panel-eyebrow">Booking Workspace</p>
          <h3>{isEditingRecord ? 'Edit Event Booking' : 'Create Event Booking'}</h3>
        </div>
        <p>All event-specific fields and validation stay in this module for easier evaluator changes.</p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Customer Name *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setField('customerName', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Customer Email *</label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={form.customerEmail}
              onChange={(e) => setField('customerEmail', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Customer Mobile Number *</label>
            <input
              type="tel"
              placeholder="07XXXXXXXX"
              value={form.customerMobile}
              onChange={(e) => setField('customerMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
              pattern="\d{10}"
              minLength="10"
              maxLength="10"
              required
            />
          </div>

          <div className="form-group">
            <label>Event Type *</label>
            <select
              value={form.eventType}
              onChange={(e) => setField('eventType', e.target.value)}
              required
            >
              <option value="">Select Event Type</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Corporate">Corporate</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Conference">Conference</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hall Name *</label>
            <select value={form.hallName} onChange={(e) => onHallChange(e.target.value)} required>
              <option value="">Select Hall</option>
              {eventHalls.map((hall) => (
                <option key={hall.name} value={hall.name}>
                  {hall.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Package *</label>
            <select value={form.packageName} onChange={(e) => setField('packageName', e.target.value)} required>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium (+Rs. 10,000)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start Date & Time *</label>
            <input
              type="datetime-local"
              value={form.eventDateTime}
              onChange={(e) => setField('eventDateTime', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date & Time *</label>
            <input
              type="datetime-local"
              value={form.endDateTime}
              onChange={(e) => setField('endDateTime', e.target.value)}
              min={form.eventDateTime || undefined}
              disabled={!form.eventDateTime}
              required
            />
          </div>

          <div className="form-group">
            <label>Duration</label>
            <input type="text" value={eventDurationLabel} placeholder="0h 0min" readOnly />
          </div>

          <div className="form-group">
            <label>Attendees *</label>
            <input
              type="number"
              min="1"
              value={form.attendees}
              onChange={(e) => setField('attendees', Number(e.target.value) || 1)}
              required
            />
          </div>

          <div className="form-group">
            <label>Price per Hour (Rs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerGuest}
              onChange={(e) => setField('pricePerGuest', Number(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Total Price</label>
            <input type="text" value={eventDurationLabel ? formatEventCurrency(eventTotalPrice) : ''} readOnly />
          </div>

          {canManageEventRecords && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                {eventStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group full-width">
            <label>Special Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows="4"
              placeholder="Decor, catering, schedule, or special requests"
            />
          </div>
        </div>

        {selectedEventHall && (
          <div className="event-selection-summary">
            <div>
              <small>Selected Hall</small>
              <strong>{selectedEventHall.name}</strong>
            </div>
            <div>
              <small>Venue Type</small>
              <strong>{selectedEventHall.type}</strong>
            </div>
            <div>
              <small>Capacity</small>
              <strong>{selectedEventHall.capacity}</strong>
            </div>
            <div>
              <small>Hourly Rate</small>
              <strong>{formatEventCurrency(selectedEventHall.price_per_hour)}</strong>
            </div>
          </div>
        )}

        {formError && <div className="inline-error">{formError}</div>}

        <div className="form-actions">
          <button type="submit" className="btn primary">
            {isEditingRecord ? 'Update Booking' : 'Create Booking'}
          </button>
          <button type="button" className="btn secondary" onClick={onReset}>
            {isEditingRecord ? 'Cancel Edit' : 'Clear Form'}
          </button>
        </div>
      </form>
    </section>
  );
}
