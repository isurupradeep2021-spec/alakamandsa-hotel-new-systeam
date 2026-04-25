import { eventHalls } from './eventHallsData';
import { EVENT_FORM_DEFAULTS } from './eventModuleConfig';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseLocalDateTimeString = (value) => {
  if (!value) return null;
  const normalized = value.trim().replace(' ', 'T');
  const withoutZone = normalized.replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
  const trimmed = withoutZone.length > 19 ? withoutZone.slice(0, 19) : withoutZone;
  const [datePart, timePart] = trimmed.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = timePart.split(':').map(Number);
  if ([year, month, day, hour, minute, second].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, second);
};

export const formatEventDate = (value) => {
  if (!value) return '-';
  const date = parseLocalDateTimeString(value);
  return date === null ? value : date.toLocaleString();
};

export const formatEventCurrency = (value) => {
  const amount = Number(value) || 0;
  return `Rs. ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const createEmptyEventForm = (user) => {
  const nextForm = { ...EVENT_FORM_DEFAULTS };

  if (user?.role === 'CUSTOMER' && user?.fullName) {
    nextForm.customerName = user.fullName;
  }

  if (user?.role === 'CUSTOMER' && EMAIL_PATTERN.test(user?.username || '')) {
    nextForm.customerEmail = user.username;
  }

  return nextForm;
};

export const calculateDurationHours = (start, end) => {
  if (!start || !end) return 0;
  const startTime = parseLocalDateTimeString(start);
  const endTime = parseLocalDateTimeString(end);
  if (startTime === null || endTime === null) return 0;
  const diffMs = endTime - startTime;
  return Math.max(0, diffMs / (1000 * 60 * 60));
};

export const formatDurationLabel = (start, end) => {
  if (!start || !end) return '';
  const startTime = parseLocalDateTimeString(start);
  const endTime = parseLocalDateTimeString(end);
  if (startTime === null || endTime === null) return '';
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return '';
  const diffMs = endTime - startTime;
  if (diffMs <= 0) return '';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}min`;
};

export const formatDateTimeInput = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = parseLocalDateTimeString(dateTimeString);
  if (date === null || Number.isNaN(date.getTime())) return '';

  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const isActiveEvent = (row) => {
  const status = (row?.status || '').toUpperCase();
  if (['CANCELLED', 'COMPLETED'].includes(status)) return false;

  const startDate = parseLocalDateTimeString(row?.eventDateTime);
  const endDate = parseLocalDateTimeString(row?.endDateTime);
  const now = new Date();
  const hasValidStart = startDate !== null && !Number.isNaN(startDate.getTime());
  const hasValidEnd = endDate !== null && !Number.isNaN(endDate.getTime());

  if (hasValidEnd) return endDate > now;
  if (hasValidStart) return startDate >= now;
  return status === 'CONFIRMED' || status === 'INQUIRY';
};

export const buildEventStatusOptions = (isCustomerPage, canManage) => {
  if (isCustomerPage) return ['INQUIRY'];
  if (!canManage) return ['INQUIRY'];
  return ['INQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
};

export const buildEventSummary = (rows, canManage) => {
  const totalEvents = rows.length;
  const activeEventCount = rows.filter((row) => isActiveEvent(row)).length;
  const pendingConfirmationCount = rows.filter((row) => (row.status || '').toUpperCase() === 'INQUIRY').length;
  const confirmedEvents = rows.filter((row) => (row.status || '').toUpperCase() === 'CONFIRMED').length;
  const completedEvents = rows.filter((row) => (row.status || '').toUpperCase() === 'COMPLETED').length;
  const totalRevenue = rows.reduce((sum, row) => sum + (Number(row.totalPrice || row.totalCost) || 0), 0);

  const currentMonthEventRevenue = rows.reduce((sum, row) => {
    const status = (row.status || '').toUpperCase();
    if (!['CONFIRMED', 'COMPLETED'].includes(status)) return sum;

    const eventDate = parseLocalDateTimeString(row.eventDateTime);
    const now = new Date();
    if (eventDate === null || Number.isNaN(eventDate.getTime())) return sum;
    if (eventDate.getFullYear() !== now.getFullYear() || eventDate.getMonth() !== now.getMonth()) return sum;

    return sum + (Number(row.totalPrice || row.totalCost) || 0);
  }, 0);

  const canonicalHallNames = new Map(eventHalls.map((hall) => [hall.name.trim().toLowerCase(), hall.name]));
  const hallCounts = rows.reduce((counts, row) => {
    const rawHallName = (row.hallName || '').trim();
    if (!rawHallName) return counts;

    const normalizedHallKey = rawHallName.toLowerCase();
    const canonicalHallName = canonicalHallNames.get(normalizedHallKey) || rawHallName;
    counts.set(canonicalHallName, (counts.get(canonicalHallName) || 0) + 1);
    return counts;
  }, new Map());

  let mostPopularHall = '-';
  let topCount = 0;
  hallCounts.forEach((count, hallName) => {
    if (count > topCount) {
      mostPopularHall = hallName;
      topCount = count;
    }
  });

  return {
    totalEvents,
    activeEventCount,
    pendingConfirmationCount,
    confirmedEvents,
    completedEvents,
    totalRevenue,
    currentMonthEventRevenue,
    mostPopularHall,
    shouldShowCustomerCounters: !canManage || rows.length > 0
  };
};

export const getTopEventType = (popularTypes = {}) => {
  const entries = Object.entries(popularTypes || {});
  if (entries.length === 0) {
    return { label: '-', count: 0 };
  }

  const [label, count] = entries.reduce((topEntry, currentEntry) => (
    currentEntry[1] > topEntry[1] ? currentEntry : topEntry
  ));

  return { label, count };
};
