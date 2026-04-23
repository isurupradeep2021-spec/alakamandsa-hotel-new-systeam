import { useMemo, useState } from 'react';
import { createReservation } from '../api/service';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  reservationDate: '',
  mealType: 'LUNCH',
  guestCount: 2,
  seatingPreference: 'INDOOR',
  specialRequests: ''
};

function ReserveTablePage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await createReservation({
        ...form,
        guestCount: Number(form.guestCount)
      });
      setMessage('Your reservation was submitted successfully. Status: Pending.');
      setForm(initialForm);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit reservation now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reserve-shell">
      <section className="reserve-hero">
        <h3>Reserve a Table</h3>
        <p>Dining capacity: 120 guests | Private rooms: 3 | Ocean view deck: 36 seats</p>
        <div className="capacity-grid">
          <article><strong>Breakfast</strong><span>7:00 AM - 10:30 AM</span></article>
          <article><strong>Lunch</strong><span>12:00 PM - 3:30 PM</span></article>
          <article><strong>Dinner</strong><span>6:30 PM - 10:30 PM</span></article>
        </div>
      </section>

      <section className="card">
        <h3>Booking Details</h3>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Date</label>
              <input
                type="date"
                min={today}
                value={form.reservationDate}
                onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Meal</label>
              <select
                value={form.mealType}
                onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                required
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
              </select>
            </div>
            <div>
              <label>Guest Count</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.guestCount}
                onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Seating Preference</label>
              <select
                value={form.seatingPreference}
                onChange={(e) => setForm({ ...form, seatingPreference: e.target.value })}
                required
              >
                <option value="INDOOR">Indoor</option>
                <option value="OUTDOOR">Outdoor</option>
                <option value="OCEAN_VIEW">Ocean View</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label>Special Requests</label>
              <input
                value={form.specialRequests}
                onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                placeholder="Dietary, celebration, accessibility requests"
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Reservation'}
          </button>
        </form>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}

export default ReserveTablePage;
