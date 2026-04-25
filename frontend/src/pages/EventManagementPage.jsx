import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  calculateDurationHours,
  buildEventStatusOptions,
  buildEventSummary,
  createEmptyEventForm,
  formatDurationLabel,
  formatDateTimeInput,
  getCurrentDateTimeInputValue,
  isPastEventDateSelection
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
  downloadEventBookingPdf,
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
  const [originalEventDateTime, setOriginalEventDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [successModalBooking, setSuccessModalBooking] = useState(null);
  const [printingBookingId, setPrintingBookingId] = useState(null);

  const pageMeta = EVENT_PAGE_META[view] || EVENT_PAGE_META.management;
  const canManageEventRecords = view !== 'booking';
  const isCustomerEventBookingPage = view === 'booking' && user?.role === 'CUSTOMER';
  const statusOptions = buildEventStatusOptions(isCustomerEventBookingPage, canManageEventRecords);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
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

  const filteredRows = useMemo(() => {
    if (!canManageEventRecords || bookingStatusFilter === 'ALL') {
      return rows;
    }

    return rows.filter((row) => (row.status || '').toUpperCase() === bookingStatusFilter);
  }, [rows, bookingStatusFilter, canManageEventRecords]);

  const displayRows = isCustomerEventBookingPage
    ? rows.slice(0, 20)
    : canManageEventRecords
    ? filteredRows.slice(0, 20)
    : rows;
  const minEventDateTime = editId && isPastEventDateSelection(form.eventDateTime, originalEventDateTime)
    ? ''
    : getCurrentDateTimeInputValue();

  const hasBookingRecords = rows.length > 0;
  const isStatusFilterActive = bookingStatusFilter !== 'ALL';
  const bookingStatusOptions = ['ALL', ...statusOptions];

  useEffect(() => {
    setEditId(null);
    setOriginalEventDateTime('');
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
    setOriginalEventDateTime('');
    setFormError('');
    setFormSuccess('');
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
    setFormSuccess('');

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
      if (isPastEventDateSelection(form.eventDateTime, originalEventDateTime)) {
        throw new Error('Starting date & time cannot be in the past');
      }
      if (new Date(form.endDateTime) <= new Date(form.eventDateTime)) {
        throw new Error('End date & time must be after starting date & time');
      }
      const attendeesValue = Number(form.attendees);
      if (!form.attendees || !Number.isFinite(attendeesValue) || attendeesValue <= 0) {
        throw new Error('Attendees is required and must be a number greater than 0.');
      }
      if (selectedEventHall && attendeesValue > selectedEventHall.capacity) {
        throw new Error(`Attendees cannot exceed selected hall capacity of ${selectedEventHall.capacity}.`);
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
        resetForm();
        setFormSuccess('Booking updated successfully.');
      } else {
        const response = await createEventBooking(payload);
        setSuccessModalBooking(response.data || null);
        resetForm();
        setFormSuccess('Booking created successfully. A confirmation email is being sent to the customer email address.');
      }

      await load();
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Operation failed');
    }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setOriginalEventDateTime(formatDateTimeInput(row.eventDateTime));
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

  const handleDelete = async (event, row) => {
    event.preventDefault();

    try {
      setPageError('');
      await deleteEventBooking(row.id);
      setRows((current) => current.filter((booking) => booking.id !== row.id));

      if (canManageEventRecords) {
        const analyticsResponse = await eventAnalytics();
        setAnalytics(analyticsResponse.data || {});
      }
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Delete failed');
    }
  };

  const handlePrint = async (row) => {
    setPrintingBookingId(row.id);
    setPageError('');

    try {
      const response = await downloadEventBookingPdf(row.id);
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

      if (!printWindow) {
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `event-booking-${row.id}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      setPageError(error.response?.data?.message || error.message || 'Failed to open booking PDF');
    } finally {
      setPrintingBookingId(null);
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

  const bookingTableSection = (
    <EventBookingTable
      rows={displayRows}
      canManageEventRecords={canManageEventRecords}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onPrint={handlePrint}
      loading={loading}
      statusOptions={bookingStatusOptions}
      filterStatus={bookingStatusFilter}
      onFilterStatusChange={setBookingStatusFilter}
      hasBookingRecords={hasBookingRecords}
      isStatusFilterActive={isStatusFilterActive}
    />
  );

  return (
    <div className="module-page dashboard-luxe operations-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <h2>{pageMeta.title}</h2>
          <p>{pageMeta.subtitle}</p>
        </div>
      </div>

      {pageError && <div className="inline-error">{pageError}</div>}

      <EventSummaryCards canManageEventRecords={canManageEventRecords} summary={summary} />

      {canManageEventRecords && <EventAnalyticsPanel analytics={analytics} />}

      {!isCustomerEventBookingPage && bookingTableSection}

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
          minEventDateTime={minEventDateTime}
        />
        {formSuccess && <div className="success">{formSuccess}</div>}
      </div>

      {isCustomerEventBookingPage && bookingTableSection}

      {successModalBooking && (
        <div className="modal-backdrop">
          <div className="modal-card event-success-modal">
            <div className="event-success-modal__header">
              <div>
                <p className="event-panel-eyebrow">Booking Created</p>
                <h3>Event booking created successfully</h3>
              </div>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setSuccessModalBooking(null)}
              >
                Close
              </button>
            </div>

            <p className="event-success-modal__message">
              Booking #{successModalBooking.id} was saved successfully. A confirmation email is being sent to{' '}
              <strong>{successModalBooking.customerEmail}</strong>.
            </p>

            <div className="event-success-modal__summary">
              <div>
                <small>Customer</small>
                <strong>{successModalBooking.customerName}</strong>
              </div>
              <div>
                <small>Hall</small>
                <strong>{successModalBooking.hallName}</strong>
              </div>
              <div>
                <small>Status</small>
                <strong>{successModalBooking.status}</strong>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => handlePrint(successModalBooking)}
                disabled={printingBookingId === successModalBooking.id}
              >
                {printingBookingId === successModalBooking.id ? 'Preparing PDF...' : 'Print Booking PDF'}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setSuccessModalBooking(null)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
