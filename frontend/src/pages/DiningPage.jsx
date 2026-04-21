import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMenuItems } from '../api/service';
import { useAuth } from '../context/AuthContext';

const cuisineTypes = [
  { label: 'Western', value: 'WESTERN' },
  { label: 'Thai/Chinese', value: 'THAI_CHINESE' },
  { label: 'Sri Lankan', value: 'SRI_LANKAN' },
  { label: 'Indian', value: 'INDIAN' },
  { label: 'Italian', value: 'ITALIAN' }
];

const amenities = ['Fully Air-Conditioned Dining Hall', 'Dedicated Parking Area', 'Wheelchair Accessibility', 'Panoramic Ocean Views'];

function DiningPage() {
  const { user } = useAuth();
  const [activeCuisine, setActiveCuisine] = useState(cuisineTypes[0]);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getMenuItems()
      .then((res) => setMenuItems((res.data || []).filter((item) => item.available)))
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load menu right now.'));
  }, []);

  const filteredMenu = useMemo(
    () => menuItems.filter((item) => item.cuisine === activeCuisine.value),
    [activeCuisine, menuItems]
  );
  const canCreateReservation = (user?.permissions || []).includes('CREATE_RESERVATIONS');
  const isRestaurantOpsView = ['SUPER_ADMIN', 'MANAGER', 'RESTAURANT_MANAGER'].includes(user?.role);

  return (
    <div className="dining-page">
      <section className="dining-hero card">
        <div>
          <p className="eyebrow">ALAKAMANDA DINING</p>
          <h2>Oceanfront flavors crafted for every craving.</h2>
          <p>
            {isRestaurantOpsView
              ? 'Live service view for restaurant operators: menu readiness, cuisine spread, and guest-facing quality.'
              : 'Explore signature dishes from five cuisines and reserve your preferred table in minutes.'}
          </p>
          <div className="hero-cta">
            {canCreateReservation && <Link to="/reserve-table" className="btn">Book a table</Link>}
            <a href="#live-menu" className="btn ghost">View menu</a>
          </div>
        </div>
        <div className="hours-strip">
          <h4>Operating Hours</h4>
          <p>Breakfast: 7:00 AM - 10:30 AM</p>
          <p>Lunch: 12:00 PM - 3:30 PM</p>
          <p>Dinner: 6:30 PM - 10:30 PM</p>
        </div>
      </section>

      <section className="card">
        <h3>Cuisine Overview</h3>
        <div className="cuisine-grid">
          {cuisineTypes.map((cuisine) => (
            <article key={cuisine.value} className="cuisine-card">
              <h4>{cuisine.label}</h4>
              <p>Chef-selected highlights prepared with seasonal ingredients.</p>
            </article>
          ))}
        </div>
      </section>

      <section id="live-menu" className="card">
        <div className="section-head">
          <h3>Live Menu</h3>
          {canCreateReservation && <Link to="/reserve-table" className="btn small">Book a table</Link>}
        </div>
        <div className="cuisine-tabs">
          {cuisineTypes.map((cuisine) => (
            <button
              key={cuisine.value}
              type="button"
              className={`tab-btn ${activeCuisine.value === cuisine.value ? 'active' : ''}`}
              onClick={() => setActiveCuisine(cuisine)}
            >
              {cuisine.label}
            </button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="menu-grid">
          {filteredMenu.map((item) => (
            <article key={item.id} className="menu-card">
              {item.imageUrl && <img className="menu-item-image" src={item.imageUrl} alt={item.name} />}
              <p className="menu-cuisine">{activeCuisine.label}</p>
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <strong>Rs. {item.price.toLocaleString()}</strong>
            </article>
          ))}
          {!filteredMenu.length && <p>No available items in this cuisine right now.</p>}
        </div>
      </section>

      <section className="card amenities">
        <div className="section-head">
          <h3>Amenities</h3>
          {canCreateReservation && <Link to="/reserve-table" className="btn small">Book a table</Link>}
        </div>
        <ul>
          {amenities.map((amenity) => (
            <li key={amenity}>{amenity}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DiningPage;
