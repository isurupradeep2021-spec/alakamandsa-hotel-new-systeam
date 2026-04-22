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

const galleryImages = [
  '/gallery/1.png',
  '/gallery/2.png',
  '/gallery/3.png',
  '/gallery/4.png',
  '/gallery/5.png',
];

function DiningPage() {
  const { user } = useAuth();
  const [activeCuisine, setActiveCuisine] = useState(cuisineTypes[0]);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const nextSlide = () => setCurrentSlide((p) => (p === galleryImages.length - 1 ? 0 : p + 1));
  const prevSlide = () => setCurrentSlide((p) => (p === 0 ? galleryImages.length - 1 : p - 1));

  return (
    <div className="dining-page">
      <section className="restaurant-dining-hero">
        <h1 className="rd-title">Restaurant & Dining</h1>
        <div className="rd-text">
          <p>At Alakamanda Hotel's All Day Dining Restaurant, we redefine dining experiences with our exceptional offerings and personalized service. Here's why our restaurant stands out</p>
          <p>Our restaurant boasts panoramic views of the Indian Ocean. Experience more than just dining – enjoy a unique culinary journey designed to delight your senses. Our dedication to personalised service ensures that every guest feels like a VIP, with our team going above and beyond to make your dining experience memorable.</p>
          <p>Step into our fusion Bar and witness our seasoned chefs weave their culinary artistry, transforming ingredients into masterpieces before your eyes. We go beyond mere cooking; we craft personalised meals with passion and precision, ensuring each dish tells a story. Immerse yourself in a dining experience where every bite is a delightful adventure, making your visit to our restaurant an unforgettable and cherished memory.</p>
        </div>

        <div className="rd-info-row">
          <div className="rd-info-item">
            <span className="rd-icon">🛎️</span>
            <div>
              <strong>Menu</strong>
              <span>A la carte</span>
            </div>
          </div>
          <div className="rd-divider"></div>
          <div className="rd-info-item">
            <span className="rd-icon">👔</span>
            <div>
              <strong>Dress code</strong>
              <span>Smart Casual</span>
            </div>
          </div>
          <div className="rd-divider"></div>
          <div className="rd-info-item">
            <span className="rd-icon">👥</span>
            <div>
              <strong>Capacity</strong>
              <span>Maximum - Indoor 60 pax, Outdoor 40 pax</span>
            </div>
          </div>
        </div>

        <div className="rd-quote">
          <span className="quote-mark">“</span>
          <h2>Dine in<br/>Elegance<br/>at Alakamanda</h2>
        </div>
      </section>

      <section className="photo-gallery-wrapper">
        <div className="gallery-carousel">
          <button className="gallery-nav left" onClick={prevSlide}>&lt;</button>
          
          <div className="gallery-slide-container">
            <img src={galleryImages[currentSlide]} alt={`Gallery image ${currentSlide + 1}`} className="gallery-image" />
            <div className="gallery-counter">
              <strong>{currentSlide + 1}</strong> / {galleryImages.length}
            </div>
          </div>

          <button className="gallery-nav right" onClick={nextSlide}>&gt;</button>
        </div>
      </section>

      <section className="reserve-banner">
        <div className="rb-text">
          <h2>Reserve a Table</h2>
          <p>Step into culinary refinement. Secure your table for an exquisite dining experience, where flavours dance on your palate amid a sophisticated ambiance. Book now for a memorable indulgence.</p>
        </div>
        <div className="rb-actions">
          {canCreateReservation ? (
            <Link to="/reserve-table" className="btn-pill filled">• BOOK ONLINE •</Link>
          ) : null}
          <a href="tel:+94112345678" className="btn-pill outline">• CALL NOW •</a>
          <a href="/alakamanda_menu.png" download="Alakamanda_Menu.png" className="btn-pill outline">• DOWNLOAD MENU •</a>
        </div>
      </section>

      <section className="amenities-box">
        <div className="amenity-grid">
          <div className="amenity-item"><span className="sq">□</span> SeaScape Restaurant max 60 pax, Seacape Lounge max 40 pax</div>
          <div className="amenity-item"><span className="sq">□</span> Special Needs</div>
          <div className="amenity-item"><span className="sq">□</span> Air conditioning</div>
          <div className="amenity-item"><span className="sq">□</span> Parking for guests</div>
          <div className="amenity-item"><span className="sq">□</span> On site technical Support</div>
          <div className="amenity-item"><span className="sq">□</span> Designated Smoking area</div>
        </div>
      </section>

      <section className="types-of-cuisines">
        <h2>Types of Cuisines</h2>
        <div className="cuisines-list">
          <div className="cuisine-col">
            <strong>Western</strong>
            <span>Everyday</span>
            <small>Breakfast | Lunch | Dinner</small>
          </div>
          <div className="rd-divider"></div>
          <div className="cuisine-col">
            <strong>Thai/Chinese</strong>
            <span>Everyday</span>
            <small>Lunch | Dinner</small>
          </div>
          <div className="rd-divider"></div>
          <div className="cuisine-col">
            <strong>Sri Lankan</strong>
            <span>Everyday</span>
            <small>Breakfast | Lunch | Dinner</small>
          </div>
          <div className="rd-divider"></div>
          <div className="cuisine-col">
            <strong>Indian</strong>
            <span>Everyday</span>
            <small>Breakfast | Lunch | Dinner</small>
          </div>
          <div className="rd-divider"></div>
          <div className="cuisine-col">
            <strong>Italian</strong>
            <span>Everyday</span>
            <small>Lunch | Dinner</small>
          </div>
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

      {/* Amenities removed, now part of the amenities-box above */}
    </div>
  );
}

export default DiningPage;
