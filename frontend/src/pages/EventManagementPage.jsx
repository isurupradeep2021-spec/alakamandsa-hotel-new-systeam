import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  calculateDurationHours,
  buildEventStatusOptions,
  buildEventSummary,
  createEmptyEventForm,
  formatDurationLabel,
  formatDateTimeInput
} from '../eventBookingUtils';
import { eventHalls } from '../eventHallsData';
import { EVENT_PAGE_META } from '../eventModuleConfig';
import EventAnalyticsPanel from '../event-management/components/EventAnalyticsPanel';
import EventBookingForm from '../event-management/components/EventBookingForm';
import EventBookingTable from '../event-management/components/EventBookingTable';
import EventHallGallery from '../event-management/components/EventHallGallery';
import EventSummaryCards from '../event-management/components/EventSummaryCards';
import {
  createEventBooking,
  deleteEventBooking,
  eventAnalytics,
  getEventBookings,
  updateEventBooking
} from '../api/service';
import '../event-management/eventManagement.css';

export default function EventManagementPage({ view = 'management' }) {
  const { user } = useAuth();
  const bookingFormRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [form, setForm] = useState(() => createEmptyEventForm(user));
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');

  const pageMeta = EVENT_PAGE_META[view] || EVENT_PAGE_META.management;
  const canManageEventRecords = view !== 'booking';
  const isCustomerEventBookingPage = view === 'booking' && user?.role === 'CUSTOMER';
  const statusOptions = buildEventStatusOptions(isCustomerEventBookingPage, canManageEventRecords);
  const selectedEventHall = useMemo(
    () => eventHalls.find((hall) => hall.name === form.hallName) || null,
    [form.hallName]
  );
  const eventDurationHours = useMemo(
    () => calculateDurationHours(form.eventDateTime, form.endDateTime),
    [form.eventDateTime, form.endDateTime]
  );
  const eventDurationLabel = useMemo(
    () => formatDurationLabel(form.eventDateTime, form.endDateTime),
    [form.eventDateTime, form.endDateTime]
  );
  const eventTotalPrice = useMemo(
    () => Number((((Number(form.pricePerGuest) || 0) * eventDurationHours) + (form.packageName === 'Premium' ? 10000 : 0)).toFixed(2)),
    [eventDurationHours, form.packageName, form.pricePerGuest]
  );
  const summary = useMemo(
    () => buildEventSummary(rows, canManageEventRecords),
    [rows, canManageEventRecords]
  );

  useEffect(() => {
    setEditId(null);
    setForm(createEmptyEventForm(user));
  }, [user]);

  useEffect(() => {
    setForm((current) => {
      if (editId || current.customerEmail) {
        return current;
      }

      return {
        ...current,
        customerEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user?.username || '') ? user.username : ''
      };
    });
  }, [editId, user]);

  const load = async () => {
    setLoading(true);
    setPageError('');
    try {
      if (canManageEventRecords) {
        const [list, analyticsResponse] = await Promise.all([getEventBookings(), eventAnalytics()]);
        setRows(list.data || []);
        setAnalytics(analyticsResponse.data || {});
      } else {
        const list = await getEventBookings();
        setRows(list.data || []);
        setAnalytics({});
      }
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [canManageEventRecords]);

  const resetForm = () => {
    setEditId(null);
    setFormError('');
    setForm(createEmptyEventForm(user));
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleHallChange = (hallName) => {
    const selectedHall = eventHalls.find((hall) => hall.name === hallName);

    setForm((current) => ({
      ...current,
      hallName,
      pricePerGuest: selectedHall ? selectedHall.price_per_hour : current.pricePerGuest
    }));
  };

  const handleSelectEventHall = (hall) => {
    setEditId(null);
    setFormError('');
    setForm((current) => ({
      ...createEmptyEventForm(user),
      ...current,
      hallName: hall.name,
      packageName: current.packageName || 'Standard',
      pricePerGuest: hall.price_per_hour,
      notes: current.notes || `Venue Type: ${hall.type} | Capacity: ${hall.capacity}`
    }));
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateOrUpdate = async (event) => {
    event.preventDefault();
    setPageError('');
    setFormError('');

    try {
      if (!form.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
        throw new Error('Customer email must be a valid email address');
      }
      if (!/^\d{10}$/.test(form.customerMobile || '')) {
        throw new Error('Customer mobile number must be exactly 10 digits');
      }
      if (!form.eventDateTime || !form.endDateTime) {
        throw new Error('Starting date & time and end date & time are required');
      }
      if (new Date(form.endDateTime) <= new Date(form.eventDateTime)) {
        throw new Error('End date & time must be after starting date & time');
      }

      const payload = {
        ...form,
        durationHours: eventDurationHours,
        totalPrice: eventTotalPrice,
        totalCost: eventTotalPrice
      };

      if (editId) {
        if (!canManageEventRecords) {
          throw new Error('Editing event records is not allowed on the event booking page');
        }
        await updateEventBooking(editId, payload);
      } else {
        await createEventBooking(payload);
      }

      resetForm();
      await load();
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Operation failed');
    }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setFormError('');
    setForm({
      ...createEmptyEventForm(user),
      customerName: row.customerName || '',
      customerEmail: row.customerEmail || '',
      customerMobile: row.customerMobile || '',
      eventType: row.eventType || '',
      hallName: row.hallName || '',
      packageName: row.packageName || 'Standard',
      eventDateTime: formatDateTimeInput(row.eventDateTime),
      endDateTime: formatDateTimeInput(row.endDateTime),
      attendees: row.attendees || 1,
      pricePerGuest: Number(row.pricePerGuest) || 0,
      status: row.status || 'INQUIRY',
      notes: row.notes || ''
    });
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (row) => {
    try {
      setPageError('');
      await deleteEventBooking(row.id);
      await load();
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="module-page dashboard-luxe operations-luxe">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page dashboard-luxe operations-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">{pageMeta.code}</p>
          <h2>{pageMeta.title}</h2>
          <p>{pageMeta.subtitle}</p>
        </div>
        <div className="hero-chip">
          <i className={`bi ${pageMeta.icon}`} />
          Live Module
        </div>
      </div>

      {pageError && <div className="inline-error">{pageError}</div>}

      <EventSummaryCards canManageEventRecords={canManageEventRecords} summary={summary} />

      {canManageEventRecords && <EventAnalyticsPanel analytics={analytics} />}

      <EventHallGallery onSelectHall={handleSelectEventHall} />

      <div ref={bookingFormRef}>
        <EventBookingForm
          form={form}
          setField={setField}
          onHallChange={handleHallChange}
          onSubmit={handleCreateOrUpdate}
          onReset={resetForm}
          formError={formError}
          isEditingRecord={Boolean(editId) && canManageEventRecords}
          eventStatusOptions={statusOptions}
          selectedEventHall={selectedEventHall}
          eventDurationLabel={eventDurationLabel}
          eventTotalPrice={eventTotalPrice}
          canManageEventRecords={canManageEventRecords}
        />
      </div>

      <EventBookingTable
        rows={rows}
        canManageEventRecords={canManageEventRecords}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
}
