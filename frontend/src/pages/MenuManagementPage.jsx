import { useEffect, useState } from 'react';
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  toggleMenuItemAvailability,
  uploadMenuItemImage,
  updateMenuItem
} from '../api/service';

const cuisineOptions = ['WESTERN', 'THAI_CHINESE', 'SRI_LANKAN', 'INDIAN', 'ITALIAN'];
const mealServiceOptions = ['BREAKFAST', 'LUNCH', 'DINNER', 'ALL_DAY'];

const emptyForm = {
  name: '',
  cuisine: 'WESTERN',
  price: '',
  description: '',
  badge: '',
  mealService: 'LUNCH',
  available: true
};

const formatLabel = (value) => value?.replaceAll('_', ' ') || '-';

function MenuManagementPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState({});
  const totalItems = rows.length;
  const availableItems = rows.filter((item) => item.available).length;
  const withImages = rows.filter((item) => Boolean(item.imageUrl)).length;

  const load = async (nextSearch = search, nextCuisine = cuisineFilter) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (nextSearch.trim()) params.search = nextSearch.trim();
      if (nextCuisine !== 'ALL') params.cuisine = nextCuisine;
      const res = await getMenuItems(params);
      setRows(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(search, cuisineFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, cuisineFilter]);

  const createItem = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await createMenuItem({
        ...form,
        price: Number(form.price)
      });
      setMessage('Menu item added.');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create menu item.');
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditingForm({
      name: row.name,
      cuisine: row.cuisine,
      price: row.price,
      description: row.description,
      badge: row.badge || '',
      mealService: row.mealService,
      available: row.available
    });
  };

  const saveEdit = async (id) => {
    setMessage('');
    setError('');
    try {
      await updateMenuItem(id, {
        ...editingForm,
        price: Number(editingForm.price)
      });
      setMessage('Menu item updated.');
      setEditingId(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update menu item.');
    }
  };

  const onToggleAvailability = async (id, available) => {
    setMessage('');
    setError('');
    try {
      await toggleMenuItemAvailability(id, !available);
      setMessage('Availability updated.');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update availability.');
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    setMessage('');
    setError('');
    try {
      await deleteMenuItem(id);
      setMessage('Menu item deleted.');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete item.');
    }
  };

  const uploadImage = async (id) => {
    const file = imageFiles[id];
    if (!file) {
      setError('Please choose an image file first.');
      return;
    }
    setMessage('');
    setError('');
    try {
      await uploadMenuItemImage(id, file);
      setImageFiles({ ...imageFiles, [id]: null });
      setMessage('Menu item image uploaded.');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to upload image.');
    }
  };

  return (
    <div className="restaurant-page">
      <section className="card restaurant-hero">
        <p className="eyebrow">RESTAURANT CONTROL</p>
        <h3>Menu Management</h3>
        <p>Manage your live dishes with clearer controls, media, and availability updates.</p>
        <div className="ops-stats-grid">
          <article><strong>{totalItems}</strong><span>Total Dishes</span></article>
          <article><strong>{availableItems}</strong><span>Available Now</span></article>
          <article><strong>{withImages}</strong><span>With Images</span></article>
        </div>
      </section>

      <section className="card">
      <div className="section-head">
        <h3>Dish Library</h3>
        <button className="btn small" onClick={() => setShowModal(true)}>Add New Item</button>
      </div>

      <div className="toolbar smart-toolbar">
        <input
          placeholder="Live search by dish name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
          <option value="ALL">All Cuisines</option>
          {cuisineOptions.map((option) => (
            <option key={option} value={option}>{formatLabel(option)}</option>
          ))}
        </select>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading menu items...</p>}

      {!loading && (
        <div className="menu-admin-grid">
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            return (
              <article key={row.id} className="menu-admin-card">
                <div className="menu-admin-head">
                  <span className={`availability-dot ${row.available ? 'on' : 'off'}`} />
                  <small>{row.available ? 'Available' : 'Unavailable'}</small>
                </div>

                {isEditing ? (
                  <div className="menu-edit-grid">
                    <input
                      value={editingForm.name}
                      onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    />
                    <select
                      value={editingForm.cuisine}
                      onChange={(e) => setEditingForm({ ...editingForm, cuisine: e.target.value })}
                    >
                      {cuisineOptions.map((option) => (
                        <option key={option} value={option}>{formatLabel(option)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={editingForm.price}
                      onChange={(e) => setEditingForm({ ...editingForm, price: e.target.value })}
                    />
                    <input
                      value={editingForm.description}
                      onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                    />
                    <input
                      value={editingForm.badge}
                      onChange={(e) => setEditingForm({ ...editingForm, badge: e.target.value })}
                    />
                    <select
                      value={editingForm.mealService}
                      onChange={(e) => setEditingForm({ ...editingForm, mealService: e.target.value })}
                    >
                      {mealServiceOptions.map((option) => (
                        <option key={option} value={option}>{formatLabel(option)}</option>
                      ))}
                    </select>
                    <div className="inline-actions">
                      <button className="btn small" onClick={() => saveEdit(row.id)}>Save</button>
                      <button className="btn ghost small" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {row.imageUrl && <img className="menu-item-image" src={row.imageUrl} alt={row.name} />}
                    <h4>{row.name}</h4>
                    <p>{row.description}</p>
                    <p><strong>Cuisine:</strong> {formatLabel(row.cuisine)}</p>
                    <p><strong>Meal:</strong> {formatLabel(row.mealService)}</p>
                    <p><strong>Price:</strong> Rs. {Number(row.price || 0).toLocaleString()}</p>
                    {row.badge && <p><strong>Badge:</strong> {row.badge}</p>}
                    <div className="inline-actions">
                      <button className="btn small" onClick={() => startEdit(row)}>Edit</button>
                      <button className="btn ghost small" onClick={() => onToggleAvailability(row.id, row.available)}>
                        {row.available ? 'Set Unavailable' : 'Set Available'}
                      </button>
                      <button className="btn danger small" onClick={() => removeItem(row.id)}>Delete</button>
                    </div>
                    <div className="inline-actions">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => setImageFiles({ ...imageFiles, [row.id]: e.target.files?.[0] || null })}
                      />
                      <button className="btn small" onClick={() => uploadImage(row.id)}>Upload Image</button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
          {!rows.length && <p>No menu items found.</p>}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-head">
              <h3>Add New Dish</h3>
              <button className="btn ghost small" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <form onSubmit={createItem}>
              <div className="form-grid">
                <div>
                  <label>Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Cuisine</label>
                  <select
                    value={form.cuisine}
                    onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                    required
                  >
                    {cuisineOptions.map((option) => (
                      <option key={option} value={option}>{formatLabel(option)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Price</label>
                  <input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Meal Service</label>
                  <select
                    value={form.mealService}
                    onChange={(e) => setForm({ ...form, mealService: e.target.value })}
                    required
                  >
                    {mealServiceOptions.map((option) => (
                      <option key={option} value={option}>{formatLabel(option)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Badge</label>
                  <input
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  />
                </div>
                <div>
                  <label>Availability</label>
                  <select
                    value={String(form.available)}
                    onChange={(e) => setForm({ ...form, available: e.target.value === 'true' })}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>
              <button className="btn" type="submit">Add Dish</button>
            </form>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}

export default MenuManagementPage;
