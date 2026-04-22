import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { createRoomBooking, getMyRoomBookings, getRooms } from "../api/service";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getRemainingRoomsCount = (room) => {
    const value = Number(room?.remainingRooms);
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
    const [selectedRoomAvailability, setSelectedRoomAvailability] = useState(null);
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
            setSelectedRoomAvailability(null);
            setAvailabilityError("");
            return;
        }

        setAvailabilityLoading(true);
        setAvailabilityError("");

        getRooms({ checkInDate, checkOutDate })
            .then((res) => {
                const rooms = res.data || [];
                const matchedRoom = rooms.find((room) => String(room.roomNumber).toLowerCase() === roomNumber.toLowerCase());

                if (!matchedRoom) {
                    setSelectedRoomAvailability(null);
                    setAvailabilityError("Room not found for selected dates.");
                    return;
                }

                setSelectedRoomAvailability(matchedRoom);
            })
            .catch((err) => {
                setSelectedRoomAvailability(null);
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
        const remainingRooms = getRemainingRoomsCount(selectedRoomAvailability);

        if (!bookingCustomer || !customerEmail || !roomNumber || !checkInDate || !checkOutDate || !bookingForm.guestCount) {
            setBookingError("Please complete all booking fields.");
            return;
        }

        if (!customerEmail.includes("@")) {
            setBookingError("Please enter a valid customer email.");
            return;
        }

        if (selectedRoomAvailability && remainingRooms === null) {
            setBookingError("Room availability data is currently unavailable. Please recheck the selected dates.");
            return;
        }

        if (selectedRoomAvailability && bookedRooms > remainingRooms) {
            setBookingError(`Only ${remainingRooms} room(s) remaining for Room ${selectedRoomAvailability.roomNumber} in the selected dates.`);
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
    const bookingTotal = selectedRoomAvailability ? Number(selectedRoomAvailability.normalPrice || 0) * stayDuration : 0;
    const remainingRooms = getRemainingRoomsCount(selectedRoomAvailability);

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
                            {!availabilityLoading && !availabilityError && selectedRoomAvailability && (
                                <div className="booking-preview">
                                    {remainingRooms === null ? (
                                        <p className="error">Room availability data is unavailable for this selection.</p>
                                    ) : (
                                        <>
                                            <p className="room-stock-note">
                                                Room {selectedRoomAvailability.roomNumber}: {remainingRooms} room{remainingRooms === 1 ? "" : "s"} remaining
                                            </p>
                                            <p>Room Availability: {remainingRooms} room{remainingRooms === 1 ? "" : "s"} remaining</p>
                                        </>
                                    )}
                                    <p>Stay Duration: {stayDuration} night{stayDuration === 1 ? "" : "s"}</p>
                                    <p>Total: LKR {bookingTotal.toLocaleString()}</p>
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
