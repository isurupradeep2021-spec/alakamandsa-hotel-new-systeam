import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildEventSummary,
  calculateDurationHours,
  createEmptyEventForm,
  formatDurationLabel
} from '../eventBookingUtils';
import {
  createEventBooking,
  getEventBookings
} from '../api/service';
import { eventHalls } from '../eventHallsData';
import EventBookingForm from '../event-management/components/EventBookingForm';
import EventManagerHallGallery from '../event-manager-booking/components/EventManagerHallGallery';
import EventManagerRecordsTable from '../event-manager-booking/components/EventManagerRecordsTable';
import EventManagerSummaryCards from '../event-manager-booking/components/EventManagerSummaryCards';
import '../event-manager-booking/eventManagerBooking.css';

const BOOKING_STATUS_OPTIONS = ['INQUIRY', 'CONFIRMED'];

function EventManagerBookingPage() {
  const formRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(createEmptyEventForm(null));
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const durationHours = useMemo(
    () => calculateDurationHours(form.eventDateTime, form.endDateTime),
    [form.eventDateTime, form.endDateTime]
  );
  const durationLabel = useMemo(
    () => formatDurationLabel(form.eventDateTime, form.endDateTime),
    [form.eventDateTime, form.endDateTime]
  );
  const totalPrice = useMemo(
    () => Number((((Number(form.pricePerGuest) || 0) * durationHours) + (form.packageName === 'Premium' ? 10000 : 0)).toFixed(2)),
    [durationHours, form.packageName, form.pricePerGuest]
  );
  const summary = useMemo(() => buildEventSummary(rows, true), [rows]);
  const latestRows = useMemo(() => rows.slice(0, 6), [rows]);

  const loadRows = async () => {
    setLoading(true);
    setPageError('');
    try {
      const response = await getEventBookings();
      setRows(response.data || []);
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Failed to load event booking data');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    loadRows();
  }, []);

  const resetForm = () => {
    setForm(createEmptyEventForm(null));
    setFormError('');
    setFormSuccess('');
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applySelectedHall = (hallNameOrHall) => {
    const selectedHall = typeof hallNameOrHall === 'string'
      ? eventHalls.find((hall) => hall.name === hallNameOrHall)
      : hallNameOrHall;

    if (!selectedHall) {
      setField('hallName', '');
      return;
    }

    setForm((current) => ({
      ...current,
      hallName: selectedHall.name,
      pricePerGuest: selectedHall.price_per_hour,
      notes: current.notes || `Venue Type: ${selectedHall.type} | Capacity: ${selectedHall.capacity}`
    }));

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');
    setPageError('');

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

      await createEventBooking({
        ...form,
        durationHours,
        totalPrice,
        totalCost: totalPrice
      });

      setForm(createEmptyEventForm(null));
      setFormSuccess('Event booking created successfully.');
      setFormError('');
      await loadRows();
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Failed to create event booking');
    }
  };

  return (
    <div className="atelier-page">
      <section className="atelier-hero">
        <div className="atelier-hero-head">
          <div>
            <p className="atelier-eyebrow">Event Atelier</p>
            <h2>Event Booking</h2>
            <p>Browse venues, create event bookings, and review the latest event records.</p>
          </div>
          <div className="atelier-chip">
            <i className="bi bi-calendar2-check" />
            Live Module
          </div>
        </div>
      </section>

      {pageError && <div className="inline-error">{pageError}</div>}

      <EventManagerSummaryCards summary={summary} />
      <EventManagerHallGallery onSelectHall={applySelectedHall} />

      <div ref={formRef}>
        <EventBookingForm
          form={form}
          setField={setField}
          onHallChange={applySelectedHall}
          onSubmit={handleSubmit}
          onReset={resetForm}
          formError={formError}
          isEditingRecord={false}
          eventStatusOptions={BOOKING_STATUS_OPTIONS}
          selectedEventHall={eventHalls.find((hall) => hall.name === form.hallName) || null}
          eventDurationLabel={durationLabel}
          eventTotalPrice={totalPrice}
          canManageEventRecords
        />
        {formSuccess && <div className="success">{formSuccess}</div>}
      </div>

      <EventManagerRecordsTable rows={latestRows} loading={loading} />
    </div>
  );
}

export default EventManagerBookingPage;
