import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useLocation } from "react-router-dom";
import { checkRoomAvailability, createRoomBooking, getMyRoomBookings, getRooms, requestRoomBookingCancellation } from "../api/service";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const CALENDAR_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ROOM_TYPE_GUEST_LIMITS = {
    STANDARD: 2,
    DELUXE: 3,
    SUITE: 4,
    FAMILY: 6,
};

function toIsoDate(dateValue) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getMonthCells(monthAnchorDate) {
    const year = monthAnchorDate.getFullYear();
    const month = monthAnchorDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyCells = firstDayOfMonth.getDay();

    const cells = [];
    for (let index = 0; index < leadingEmptyCells; index += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
}

function BookRoomPage() {
    const location = useLocation();
    const selectedRoomNumber = location.state?.roomNumber || "";
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [myBookings, setMyBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState("");
    const [availabilityData, setAvailabilityData] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [calendarAvailabilityMap, setCalendarAvailabilityMap] = useState({});
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [calendarError, setCalendarError] = useState("");
    const [bookingForm, setBookingForm] = useState({
        bookingCustomer: "",
        customerEmail: "",
        roomNumber: selectedRoomNumber,
        guestCount: "",
        checkInDate: "",
        checkOutDate: "",
    });
    const todayIso = useMemo(() => toIsoDate(new Date()), []);

    const loadMyBookings = async () => {
        setBookingsLoading(true);
        try {
            const res = await getMyRoomBookings();
            setMyBookings(res.data || []);
            setBookingError("");
        } catch (err) {
            // Keep existing rows when refresh fails to avoid hiding successfully saved bookings.
            const apiMessage = err?.response?.data?.message;
            const status = err?.response?.status;

            if (apiMessage) {
                setBookingError(apiMessage);
            } else if (status) {
                setBookingError(`Unable to load your bookings (HTTP ${status}).`);
            } else {
                setBookingError("Unable to load your bookings right now. Please refresh and try again.");
            }
        } finally {
            setBookingsLoading(false);
        }
    };

    useEffect(() => {
        loadMyBookings();
    }, []);

    useEffect(() => {
        const roomNumber = bookingForm.roomNumber.trim();
        const { checkInDate, checkOutDate } = bookingForm;

        if (!roomNumber || !checkInDate || !checkOutDate) {
            setAvailabilityData(null);
            setAvailabilityError("");
            return;
        }

        if (checkInDate < todayIso || checkOutDate < todayIso) {
            setAvailabilityData(null);
            setAvailabilityError("Past dates cannot be selected. Please choose today or a future date.");
            return;
        }

        if (checkOutDate <= checkInDate) {
            setAvailabilityData(null);
            setAvailabilityError("Check-out date must be after check-in date.");
            return;
        }

        setAvailabilityLoading(true);
        setAvailabilityError("");

        getRooms({ checkInDate, checkOutDate })
            .then((res) => {
                const rooms = res.data || [];
                const matchedRoom = rooms.find((room) => String(room.roomNumber).toLowerCase() === roomNumber.toLowerCase());

                if (!matchedRoom) {
                    setAvailabilityData(null);
                    setAvailabilityError("Room not found for selected dates.");
                    return;
                }

                setAvailabilityData(matchedRoom);

                if (matchedRoom.roomStatus !== "AVAILABLE") {
                    setAvailabilityError(`Room ${matchedRoom.roomNumber} is not available for the selected dates.`);
                } else {
                    setAvailabilityError("");
                }
            })
            .catch((err) => {
                setAvailabilityData(null);
                const apiMessage = err?.response?.data?.message;
                setAvailabilityError(apiMessage || "Unable to check room availability right now.");
            })
            .finally(() => setAvailabilityLoading(false));
    }, [bookingForm.roomNumber, bookingForm.checkInDate, bookingForm.checkOutDate, todayIso]);

    useEffect(() => {
        if (!bookingForm.checkInDate) {
            return;
        }

        const parsedDate = new Date(`${bookingForm.checkInDate}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) {
            return;
        }

        setCalendarMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    }, [bookingForm.checkInDate]);

    useEffect(() => {
        const roomNumber = bookingForm.roomNumber.trim();
        if (!roomNumber) {
            setCalendarAvailabilityMap({});
            setCalendarError("");
            return;
        }

        let isDisposed = false;

        const loadMonthlyAvailability = async () => {
            setCalendarLoading(true);
            setCalendarError("");

            const year = calendarMonth.getFullYear();
            const month = calendarMonth.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const checks = [];
            for (let day = 1; day <= daysInMonth; day += 1) {
                const checkIn = new Date(year, month, day);
                const checkOut = new Date(year, month, day + 1);
                const checkInDate = toIsoDate(checkIn);
                const checkOutDate = toIsoDate(checkOut);

                if (checkInDate < todayIso) {
                    checks.push(Promise.resolve({ date: checkInDate, status: "past", failed: false }));
                    continue;
                }

                checks.push(
                    checkRoomAvailability(roomNumber, checkInDate, checkOutDate)
                        .then((res) => ({
                            date: checkInDate,
                            status: Boolean(res?.data?.available) ? "available" : "booked",
                            failed: false,
                        }))
                        .catch(() => ({ date: checkInDate, status: "unknown", failed: true })),
                );
            }

            const results = await Promise.all(checks);
            if (isDisposed) {
                return;
            }

            const nextMap = {};
            let failedCount = 0;

            results.forEach((result) => {
                if (result.failed) {
                    failedCount += 1;
                    return;
                }
                nextMap[result.date] = result.status;
            });

            setCalendarAvailabilityMap(nextMap);

            if (failedCount === results.length) {
                setCalendarError("Unable to load room calendar right now.");
            } else if (failedCount > 0) {
                setCalendarError("Some dates could not be checked. Please retry.");
            }

            setCalendarLoading(false);
        };

        loadMonthlyAvailability().catch(() => {
            if (isDisposed) {
                return;
            }

            setCalendarAvailabilityMap({});
            setCalendarError("Unable to load room calendar right now.");
            setCalendarLoading(false);
        });

        return () => {
            isDisposed = true;
        };
    }, [bookingForm.roomNumber, calendarMonth, todayIso]);

    const handleCreateBooking = async (event) => {
        event.preventDefault();
        setBookingMessage("");
        setBookingError("");

        const bookingCustomer = bookingForm.bookingCustomer.trim();
        const customerEmail = bookingForm.customerEmail.trim();
        const roomNumber = bookingForm.roomNumber.trim();
        const guestCount = Number(bookingForm.guestCount);
        const checkInDate = bookingForm.checkInDate;
        const checkOutDate = bookingForm.checkOutDate;
        const bookedRooms = 1;

        if (!bookingCustomer || !customerEmail || !roomNumber || !checkInDate || !checkOutDate || !bookingForm.guestCount) {
            setBookingError("Please complete all booking fields.");
            return;
        }

        if (checkInDate < todayIso || checkOutDate < todayIso) {
            setBookingError("Past dates are not allowed. Please choose today or a future date.");
            return;
        }

        if (checkOutDate <= checkInDate) {
            setBookingError("Check-out date must be after check-in date.");
            return;
        }

        if (!customerEmail.includes("@")) {
            setBookingError("Please enter a valid customer email.");
            return;
        }

        if (!availabilityData) {
            setBookingError("Please check room availability before booking.");
            return;
        }

        if (availabilityError) {
            setBookingError(availabilityError);
            return;
        }

        if (!Number.isInteger(guestCount) || guestCount < 1) {
            setBookingError("Guest Count must be a whole number greater than 0.");
            return;
        }

        const roomTypeLimit = availabilityData?.roomType ? ROOM_TYPE_GUEST_LIMITS[availabilityData.roomType] : null;
        const roomCapacity = Number.isFinite(Number(availabilityData?.capacity)) ? Number(availabilityData.capacity) : null;
        const maxGuestsAllowed = roomTypeLimit && roomCapacity ? Math.min(roomTypeLimit, roomCapacity) : roomTypeLimit || roomCapacity;

        if (maxGuestsAllowed !== null && guestCount > maxGuestsAllowed) {
            setBookingError(`Guest Count exceeds the maximum allowed for this room (${maxGuestsAllowed}).`);
            return;
        }

        try {
            const res = await createRoomBooking({
                bookingCustomer,
                customerEmail,
                roomNumber,
                bookedRooms,
                guestCount,
                checkInDate,
                checkOutDate,
            });
            const savedBooking = res?.data;
            if (savedBooking?.id) {
                setMyBookings((prev) => [savedBooking, ...prev.filter((item) => item.id !== savedBooking.id)]);
                await downloadBookingQrPng(savedBooking);
            }
            setBookingMessage(`Booking created successfully for Room ${roomNumber}.`);
            setBookingForm({
                bookingCustomer: "",
                customerEmail: "",
                roomNumber: selectedRoomNumber,
                guestCount: "",
                checkInDate: "",
                checkOutDate: "",
            });
            await loadMyBookings();
        } catch (err) {
            const apiMessage = err?.response?.data?.message;
            setBookingError(apiMessage || "Failed to create booking.");
        }
    };

    const buildBookingQrPayload = (booking) => {
        return [
            `Booking ID: ${formatBookingId(booking?.bookingSequence ?? booking?.id)}`,
            `Customer: ${booking?.bookingCustomer ?? "-"}`,
            `Email: ${booking?.customerEmail ?? "-"}`,
            `Room Number: ${booking?.roomNumber ?? "-"}`,
            `Check-In: ${booking?.checkInDate ?? "-"}`,
            `Check-Out: ${booking?.checkOutDate ?? "-"}`,
            `Guests: ${booking?.guestCount ?? booking?.guests ?? "-"}`,
            `Status: ${booking?.bookingStatus ?? "-"}`,
            `Amount (LKR): ${booking?.amount ?? 0}`,
        ].join("\n");
    };

    const downloadBookingQrPng = async (booking) => {
        try {
            const qrPayload = buildBookingQrPayload(booking);
            const dataUrl = await QRCode.toDataURL(qrPayload, {
                width: 320,
                margin: 2,
            });

            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `room-booking-${formatBookingId(booking?.bookingSequence ?? booking?.id)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            setBookingError("Booking saved, but failed to generate QR code.");
        }
    };

    const formatBookingId = (bookingId) => {
        if (bookingId === null || bookingId === undefined || bookingId === "") {
            return "-";
        }

        return String(bookingId).padStart(2, "0");
    };

    const canRequestCancellation = (bookingStatus) => {
        return bookingStatus === "BOOKED";
    };

    const isApprovedCancellation = (bookingStatus) => {
        return bookingStatus === "CANCELLED";
    };

    const isPendingCancellationApproval = (bookingStatus) => {
        return bookingStatus === "CANCELLATION_REQUESTED";
    };

    const handleRequestCancellation = async (bookingId) => {
        setBookingMessage("");
        setBookingError("");

        try {
            const res = await requestRoomBookingCancellation(bookingId);
            const updated = res?.data;
            if (updated?.id) {
                setMyBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            }
            setBookingMessage("Cancellation request submitted. Waiting for manager approval.");
            await loadMyBookings();
        } catch (err) {
            const apiMessage = err?.response?.data?.message;
            setBookingError(apiMessage || "Failed to request cancellation.");
        }
    };

    const toMmDdYyyy = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const toTitleCase = (value) => {
        if (!value) {
            return "-";
        }

        return value.charAt(0) + value.slice(1).toLowerCase();
    };

    const getStayDuration = () => {
        if (!bookingForm.checkInDate || !bookingForm.checkOutDate) {
            return 0;
        }

        const checkIn = new Date(bookingForm.checkInDate);
        const checkOut = new Date(bookingForm.checkOutDate);
        const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
        return nights > 0 ? nights : 0;
    };

    const isWeekendDate = (dateValue) => {
        const date = new Date(`${dateValue}T00:00:00`);
        const day = date.getDay();
        return day === 0 || day === 5 || day === 6;
    };

    const isSeasonalDate = (dateValue) => {
        const date = new Date(`${dateValue}T00:00:00`);
        const month = date.getMonth();
        return month === 11 || month === 0 || month === 5 || month === 6;
    };

    const getRateForDate = (dateValue) => {
        if (!availabilityData) {
            return 0;
        }

        if (isSeasonalDate(dateValue) && availabilityData.seasonalPrice) {
            return Number(availabilityData.seasonalPrice);
        }

        if (isWeekendDate(dateValue)) {
            return Number(availabilityData.weekendPrice || availabilityData.normalPrice || 0);
        }

        return Number(availabilityData.normalPrice || 0);
    };

    const getEstimatedTotal = () => {
        if (!bookingForm.checkInDate || !bookingForm.checkOutDate || !availabilityData) {
            return 0;
        }

        const checkIn = new Date(bookingForm.checkInDate);
        const checkOut = new Date(bookingForm.checkOutDate);

        if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
            return 0;
        }

        let total = 0;
        const current = new Date(checkIn);

        while (current < checkOut) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, "0");
            const day = String(current.getDate()).padStart(2, "0");
            const isoDate = `${year}-${month}-${day}`;
            total += getRateForDate(isoDate);
            current.setDate(current.getDate() + 1);
        }

        return total;
    };

    const stayDuration = getStayDuration();
    const calendarMonthCells = useMemo(() => getMonthCells(calendarMonth), [calendarMonth]);
    const calendarMonthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const guestCount = Number(bookingForm.guestCount);
    const roomTypeLimit = availabilityData?.roomType ? ROOM_TYPE_GUEST_LIMITS[availabilityData.roomType] : null;
    const roomCapacity = Number.isFinite(Number(availabilityData?.capacity)) ? Number(availabilityData.capacity) : null;
    const maxGuestsAllowed = roomTypeLimit && roomCapacity ? Math.min(roomTypeLimit, roomCapacity) : roomTypeLimit || roomCapacity;
    const hasGuestLimitViolation = Number.isInteger(guestCount) && guestCount > 0 && maxGuestsAllowed !== null && guestCount > maxGuestsAllowed;
    const previewTotal = getEstimatedTotal();

    const isDateInsideSelectedStay = (isoDate) => {
        if (!bookingForm.checkInDate || !bookingForm.checkOutDate) {
            return false;
        }

        return isoDate >= bookingForm.checkInDate && isoDate < bookingForm.checkOutDate;
    };

    return (
        <div className="card">
            <h3>Book Room</h3>
            <p>Create Room Booking</p>

            <section className="book-room-shell">
                <div className="book-room-panel">
                    <section className="room-calendar-panel">
                        <div className="room-calendar-head">
                            <div>
                                <h4>Room Availability Calendar</h4>
                                <p>Selected room: {bookingForm.roomNumber?.trim() || "Please enter a room number"}</p>
                            </div>
                            <div className="room-calendar-nav">
                                <button className="btn ghost small" type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                                    Prev
                                </button>
                                <strong>{calendarMonthLabel}</strong>
                                <button className="btn ghost small" type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                                    Next
                                </button>
                            </div>
                        </div>

                        <div className="room-calendar-legend">
                            <span className="legend-dot available" />
                            <small>Available</small>
                            <span className="legend-dot booked" />
                            <small>Booked</small>
                            <span className="legend-dot past" />
                            <small>Past (not bookable)</small>
                        </div>

                        {calendarLoading && <p>Loading room calendar...</p>}
                        {!calendarLoading && calendarError && <p className="error">{calendarError}</p>}

                        <div className="room-calendar-grid" aria-label="Room availability calendar">
                            {CALENDAR_DAY_LABELS.map((label) => (
                                <div key={label} className="room-calendar-day-label">
                                    {label}
                                </div>
                            ))}

                            {calendarMonthCells.map((cell, index) => {
                                if (!cell) {
                                    return <div key={`empty-${index}`} className="room-calendar-cell empty" />;
                                }

                                const isoDate = toIsoDate(cell);
                                const isPastDate = isoDate < todayIso;
                                const availabilityStatus = isPastDate ? "past" : calendarAvailabilityMap[isoDate];
                                const inSelectedStay = isDateInsideSelectedStay(isoDate);
                                const statusLabel =
                                    availabilityStatus === "past"
                                        ? "Past date (cannot book)"
                                        : availabilityStatus === "available"
                                          ? "Available"
                                          : availabilityStatus === "booked"
                                            ? "Booked"
                                            : "Checking...";

                                return (
                                    <div
                                        key={isoDate}
                                        className={`room-calendar-cell ${availabilityStatus || "unknown"} ${inSelectedStay ? "selected-stay" : ""}`}
                                        title={`${isoDate} - ${statusLabel}`}
                                    >
                                        {cell.getDate()}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <form className="booking-form" onSubmit={handleCreateBooking}>
                        <div>
                            <label>Booking Customer</label>
                            <input value={bookingForm.bookingCustomer} onChange={(e) => setBookingForm({ ...bookingForm, bookingCustomer: e.target.value })} placeholder="Customer User" required />
                        </div>
                        <div>
                            <label>Customer Email</label>
                            <input
                                type="email"
                                value={bookingForm.customerEmail}
                                onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                                placeholder="customer@hotel.com"
                                required
                            />
                        </div>
                        <div>
                            <label>Room Number</label>
                            <input value={bookingForm.roomNumber} onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })} placeholder={selectedRoomNumber || "204"} required />
                        </div>
                        <div>
                            <label>Guest Count</label>
                            <input
                                type="number"
                                min="1"
                                max={maxGuestsAllowed ?? undefined}
                                value={bookingForm.guestCount}
                                onChange={(e) => setBookingForm({ ...bookingForm, guestCount: e.target.value })}
                                placeholder="2"
                                required
                            />
                            {maxGuestsAllowed !== null && <small>Maximum guests for this room: {maxGuestsAllowed}</small>}
                            {hasGuestLimitViolation && <p className="error">Entered Guest Count is not allowed for this room type.</p>}
                        </div>
                        <div>
                            <label>Check-In Date (mm/dd/yyyy)</label>
                            <input type="date" min={todayIso} value={bookingForm.checkInDate} onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} required />
                        </div>
                        <div>
                            <label>Check-Out Date (mm/dd/yyyy)</label>
                            <input type="date" min={todayIso} value={bookingForm.checkOutDate} onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} required />
                        </div>
                        <div className="span-full">
                            {availabilityLoading && <p>Checking live availability...</p>}
                            {!availabilityLoading && availabilityError && <p className="error">{availabilityError}</p>}
                            {!availabilityLoading && !availabilityError && availabilityData && (
                                <div className="booking-preview">
                                    <p className="success">Room {availabilityData.roomNumber} is available for the selected dates.</p>
                                    <p>
                                        Stay Duration: {stayDuration} night{stayDuration === 1 ? "" : "s"}
                                    </p>
                                    <p>Total: LKR {previewTotal.toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                        <div className="span-full">
                            <button className="btn" type="submit">
                                Create Room Booking
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {bookingMessage && <p className="success">{bookingMessage}</p>}
            {bookingError && <p className="error">{bookingError}</p>}

            <section className="card" style={{ marginTop: "14px" }}>
                <h3>My Booked Rooms</h3>

                {bookingsLoading && <p>Loading your bookings...</p>}

                {!bookingsLoading && (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Customer Name</th>
                                    <th>Customer Email</th>
                                    <th>Room Number</th>
                                    <th>Room Type</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Guests</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>{formatBookingId(booking.bookingSequence ?? booking.id)}</td>
                                        <td>{booking.bookingCustomer}</td>
                                        <td>{booking.customerEmail}</td>
                                        <td>{booking.roomNumber}</td>
                                        <td>{toTitleCase(booking.roomType)}</td>
                                        <td>{toMmDdYyyy(booking.checkInDate)}</td>
                                        <td>{toMmDdYyyy(booking.checkOutDate)}</td>
                                        <td>{booking.guestCount ?? booking.guests ?? "-"}</td>
                                        <td>{toTitleCase(booking.bookingStatus)}</td>
                                        <td>LKR {Number(booking.amount || 0).toLocaleString()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn small" type="button" onClick={() => downloadBookingQrPng(booking)}>
                                                    Download QR
                                                </button>
                                                {isApprovedCancellation(booking.bookingStatus) && (
                                                    <button className="btn ghost small" type="button" disabled>
                                                        Approved Cancel Request
                                                    </button>
                                                )}
                                                {isPendingCancellationApproval(booking.bookingStatus) && (
                                                    <button className="btn ghost small" type="button" disabled>
                                                        Pending Approval
                                                    </button>
                                                )}
                                                {canRequestCancellation(booking.bookingStatus) && (
                                                    <button className="btn danger small" type="button" onClick={() => handleRequestCancellation(booking.id)}>
                                                        Request Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {myBookings.length === 0 && (
                                    <tr>
                                        <td colSpan="11">No bookings found yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default BookRoomPage;
