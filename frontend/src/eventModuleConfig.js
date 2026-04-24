// Event module configuration
export const EVENT_PAGE_META = {
  management: {
    code: 'EVENT MANAGEMENT',
    title: 'Event Management Dashboard',
    subtitle: 'Manage event bookings, hall allocation, and revenue updates with cleaner event-only controls.',
    icon: 'bi-calendar-event'
  },
  booking: {
    code: 'EVENT BOOKING',
    title: 'Book Your Event',
    subtitle: 'Browse venues, place bookings, and track your own event requests in one place.',
    icon: 'bi-calendar-plus'
  }
};

export const EVENT_FORM_DEFAULTS = {
  customerName: '',
  customerEmail: '',
  customerMobile: '',
  eventType: '',
  hallName: '',
  packageName: 'Standard',
  eventDateTime: '',
  endDateTime: '',
  durationHours: 0,
  attendees: '',
  pricePerGuest: 0,
  totalPrice: 0,
  totalCost: 0,
  notes: '',
  status: 'INQUIRY'
};
