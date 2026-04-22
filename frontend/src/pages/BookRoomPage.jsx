import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { createRoomBooking, getMyRoomBookings, checkRoomAvailability } from "../api/service";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getRemainingRoomsCount = (availabilityData) => {
    const value = Number(availabilityData?.remainingRooms);
    return Number.isFinite(value) && value >= 0 ? value : null;
};

function BookRoomPage() {
    const location = useLocation();
    const selectedRoomNumber = location.state?.roomNumber || "";
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [myBookings, setMyBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState("");
    const [availabilityStatus, setAvailabilityStatus] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        bookingCustomer: "",
        customerEmail: "",
        roomNumber: selectedRoomNumber,
        guestCount: "",
        checkInDate: "",
        checkOutDate: "",
    });

    const loadMyBookings = async () => {
        setBookingsLoading(true);
        try {
            const res = await getMyRoomBookings();
            setMyBookings(res.data || []);
        } catch {
            setMyBookings([]);
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
            setAvailabilityStatus(null);
            setAvailabilityError("");
            return;
        }

        setAvailabilityLoading(true);
        setAvailabilityError("");

        checkRoomAvailability(roomNumber, checkInDate, checkOutDate)
            .then((res) => {
                const data = res.data;
                setAvailabilityStatus(data);
                if (!data.available) {
                    setAvailabilityError(`${data.message}`);
                }
            })
            .catch((err) => {
                setAvailabilityStatus(null);
                const apiMessage = err?.response?.data?.message;
                setAvailabilityError(apiMessage || "Unable to check room availability right now.");
            })
            .finally(() => setAvailabilityLoading(false));
    }, [bookingForm.roomNumber, bookingForm.checkInDate, bookingForm.checkOutDate]);

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
        const remainingRooms = getRemainingRoomsCount(availabilityStatus);

        if (!bookingCustomer || !customerEmail || !roomNumber || !checkInDate || !checkOutDate || !bookingForm.guestCount) {
            setBookingError("Please complete all booking fields.");
            return;
        }

        if (!customerEmail.includes("@")) {
            setBookingError("Please enter a valid customer email.");
            return;
        }

        if (!availabilityStatus) {
            setBookingError("Please check room availability before booking.");
            return;
        }

        if (!availabilityStatus.available) {
            setBookingError(`Room ${roomNumber} is not available for the selected dates.`);
            return;
        }

        if (remainingRooms === null) {
            setBookingError("Unable to determine room availability for the selected dates. Please try again.");
            return;
        }

        if (bookedRooms > remainingRooms) {
            setBookingError(`Only ${remainingRooms} room(s) remaining for Room ${availabilityStatus.roomNumber}.`);
            return;
        }

        if (!Number.isInteger(guestCount) || guestCount < 1) {
            setBookingError("Guest Count must be a whole number greater than 0.");
            return;
        }

        try {
            await createRoomBooking({
                bookingCustomer,
                customerEmail,
                roomNumber,
                bookedRooms,
                guestCount,
                checkInDate,
                checkOutDate,
            });
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

    const stayDuration = getStayDuration();
    const remainingRooms = getRemainingRoomsCount(availabilityStatus);
    const guestCount = Number(bookingForm.guestCount);

    return (
        <div className="card">
            <h3>Book Room</h3>
            <p>Create Room Booking</p>

            <section className="book-room-shell">
                <div className="book-room-panel">
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
                            <input type="number" min="1" value={bookingForm.guestCount} onChange={(e) => setBookingForm({ ...bookingForm, guestCount: e.target.value })} placeholder="2" required />
                        </div>
                        <div>
                            <label>Check-In Date (mm/dd/yyyy)</label>
                            <input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} required />
                        </div>
                        <div>
                            <label>Check-Out Date (mm/dd/yyyy)</label>
                            <input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} required />
                        </div>
                        <div className="span-full">
                            {availabilityLoading && <p>Checking live availability...</p>}
                            {!availabilityLoading && availabilityError && <p className="error">{availabilityError}</p>}
                            {!availabilityLoading && !availabilityError && availabilityStatus && (
                                <div className="booking-preview">
                                    {availabilityStatus.available ? (
                                        <>
                                            <p className="success">
                                                ✓ Available: {remainingRooms} room{remainingRooms === 1 ? "" : "s"} remaining
                                            </p>
                                            <p>
                                                Stay Duration: {stayDuration} night{stayDuration === 1 ? "" : "s"}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="error">✗ Not Available for selected dates</p>
                                    )}
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
                                    <th>Customer Name</th>
                                    <th>Customer Email</th>
                                    <th>Room Number</th>
                                    <th>Room Type</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Guests</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>{booking.bookingCustomer}</td>
                                        <td>{booking.customerEmail}</td>
                                        <td>{booking.roomNumber}</td>
                                        <td>{toTitleCase(booking.roomType)}</td>
                                        <td>{toMmDdYyyy(booking.checkInDate)}</td>
                                        <td>{toMmDdYyyy(booking.checkOutDate)}</td>
                                        <td>{booking.guestCount ?? booking.guests ?? "-"}</td>
                                        <td>{toTitleCase(booking.bookingStatus)}</td>
                                        <td>LKR {Number(booking.amount || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {myBookings.length === 0 && (
                                    <tr>
                                        <td colSpan="9">No bookings found yet.</td>
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
