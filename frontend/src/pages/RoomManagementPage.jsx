import { useEffect, useMemo, useState } from "react";
import {
    approveRoomBookingCancellation,
    createRoomBooking,
    createRoomRecord,
    deleteRoomBooking,
    deleteRoomRecord,
    getRoomBookings,
    getRooms,
    updateRoomBooking,
    updateRoomRecord,
} from "../api/service";

const initialRoomForm = {
    roomNumber: "",
    roomType: "STANDARD",
    photoUrl: "",
    roomDescription: "",
    capacity: 1,
    totalRooms: 1,
    normalPrice: "",
    weekendPrice: "",
    seasonalPrice: "",
    roomStatus: "AVAILABLE",
};

const initialBookingForm = {
    bookingCustomer: "",
    customerEmail: "",
    roomNumber: "",
    bookedRooms: 1,
    guestCount: 1,
    checkInDate: "",
    checkOutDate: "",
};

function RoomManagementPage() {
    const [roomForm, setRoomForm] = useState(initialRoomForm);
    const [bookingForm, setBookingForm] = useState(initialBookingForm);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [roomMessage, setRoomMessage] = useState("");
    const [roomError, setRoomError] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editingBookingId, setEditingBookingId] = useState(null);

    const roomOverview = useMemo(() => {
        const totalRooms = rooms.reduce((sum, room) => sum + Math.max(1, Number(room.totalRooms || 1)), 0);
        const availableRooms = rooms.reduce((sum, room) => {
            const totalForRoom = Math.max(1, Number(room.totalRooms || 1));
            const remainingRooms = Number(room.remainingRooms);

            if (Number.isFinite(remainingRooms)) {
                return sum + Math.max(0, Math.min(totalForRoom, remainingRooms));
            }

            return sum + (room.roomStatus === "AVAILABLE" ? totalForRoom : 0);
        }, 0);
        const bookedRooms = Math.max(0, totalRooms - availableRooms);

        return {
            totalRooms,
            bookedRooms,
            availableRooms,
        };
    }, [rooms]);

    const loadLatestRecords = async () => {
        const [roomRes, bookingRes] = await Promise.allSettled([getRooms(), getRoomBookings()]);

        if (roomRes.status === "fulfilled") {
            setRooms(roomRes.value.data || []);
            setRoomError("");
        } else {
            const apiMessage = roomRes.reason?.response?.data?.message;
            setRoomError(apiMessage || "Unable to refresh room records right now.");
        }

        if (bookingRes.status === "fulfilled") {
            setBookings(bookingRes.value.data || []);
            setBookingError("");
        } else {
            const apiMessage = bookingRes.reason?.response?.data?.message;
            setBookingError(apiMessage || "Unable to refresh booking records right now.");
        }
    };

    useEffect(() => {
        loadLatestRecords();
        const intervalId = window.setInterval(loadLatestRecords, 15000);
        return () => window.clearInterval(intervalId);
    }, []);

    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        setRoomMessage("");
        setRoomError("");

        try {
            const requiredChecks = [
                { label: "Room Number", value: roomForm.roomNumber?.trim() },
                { label: "Room Type", value: roomForm.roomType },
                { label: "Photo URL", value: roomForm.photoUrl?.trim() },
                { label: "Room Description", value: roomForm.roomDescription?.trim() },
                { label: "Capacity", value: String(roomForm.capacity ?? "").trim() },
                { label: "Total Rooms", value: String(roomForm.totalRooms ?? "").trim() },
                { label: "Normal Price", value: String(roomForm.normalPrice ?? "").trim() },
                { label: "Weekend Price", value: String(roomForm.weekendPrice ?? "").trim() },
                { label: "Room Status", value: roomForm.roomStatus },
            ];

            const missingFields = requiredChecks.filter((item) => !item.value).map((item) => item.label);
            if (missingFields.length > 0) {
                setRoomError(`Please fill in the following required field(s): ${missingFields.join(", ")}`);
                return;
            }

            const payload = {
                roomNumber: roomForm.roomNumber.trim(),
                roomType: roomForm.roomType,
                photoUrl: roomForm.photoUrl.trim(),
                roomDescription: roomForm.roomDescription.trim(),
                capacity: Number(roomForm.capacity),
                totalRooms: Number(roomForm.totalRooms),
                normalPrice: Number(roomForm.normalPrice),
                weekendPrice: Number(roomForm.weekendPrice),
                roomStatus: roomForm.roomStatus,
            };

            if (roomForm.seasonalPrice !== "" && roomForm.seasonalPrice !== null) {
                payload.seasonalPrice = Number(roomForm.seasonalPrice);
            }

            if (editingRoomId) {
                await updateRoomRecord(editingRoomId, payload);
                setRoomMessage("Room record updated successfully");
            } else {
                await createRoomRecord(payload);
                setRoomMessage("Room record created successfully");
            }

            setEditingRoomId(null);
            setRoomForm(initialRoomForm);
            await loadLatestRecords();
        } catch (err) {
            const apiMsg = err?.response?.data?.message;
            setRoomError(apiMsg || "Failed to save room record");
        }
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingMessage("");
        setBookingError("");

        try {
            const payload = {
                bookingCustomer: bookingForm.bookingCustomer.trim(),
                customerEmail: bookingForm.customerEmail.trim(),
                roomNumber: bookingForm.roomNumber.trim(),
                bookedRooms: Number(bookingForm.bookedRooms),
                guestCount: Number(bookingForm.guestCount),
                checkInDate: bookingForm.checkInDate,
                checkOutDate: bookingForm.checkOutDate,
            };

            if (editingBookingId) {
                await updateRoomBooking(editingBookingId, payload);
                setBookingMessage("Room booking updated successfully");
            } else {
                await createRoomBooking(payload);
                setBookingMessage("Room booking created successfully");
            }

            setEditingBookingId(null);
            setBookingForm(initialBookingForm);
            await loadLatestRecords();
        } catch (err) {
            const apiMsg = err?.response?.data?.message;
            setBookingError(apiMsg || "Failed to save room booking");
        }
    };

    const editRoom = (room) => {
        setEditingRoomId(room.id);
        setRoomForm({
            roomNumber: room.roomNumber ?? "",
            roomType: room.roomType ?? "STANDARD",
            photoUrl: room.photoUrl ?? "",
            roomDescription: room.roomDescription ?? "",
            capacity: room.capacity ?? 1,
            totalRooms: room.totalRooms ?? 1,
            normalPrice: room.normalPrice ?? "",
            weekendPrice: room.weekendPrice ?? "",
            seasonalPrice: room.seasonalPrice ?? "",
            roomStatus: room.roomStatus ?? "AVAILABLE",
        });
        setRoomMessage("");
        setRoomError("");
    };

    const editBooking = (booking) => {
        setEditingBookingId(booking.id);
        setBookingForm({
            bookingCustomer: booking.bookingCustomer ?? "",
            customerEmail: booking.customerEmail ?? "",
            roomNumber: booking.roomNumber ?? "",
            bookedRooms: booking.bookedRooms ?? 1,
            guestCount: booking.guestCount ?? 1,
            checkInDate: booking.checkInDate ?? "",
            checkOutDate: booking.checkOutDate ?? "",
        });
        setBookingMessage("");
        setBookingError("");
    };

    const removeRoom = async (id) => {
        await deleteRoomRecord(id);
        await loadLatestRecords();
    };

    const removeBooking = async (id) => {
        await deleteRoomBooking(id);
        await loadLatestRecords();
    };

    const approveCancellation = async (id) => {
        setBookingMessage("");
        setBookingError("");

        try {
            await approveRoomBookingCancellation(id);
            setBookingMessage("Cancellation approved successfully");
            await loadLatestRecords();
        } catch (err) {
            const apiMsg = err?.response?.data?.message;
            setBookingError(apiMsg || "Failed to approve cancellation request");
        }
    };

    return (
        <>
            <div className="card manager-overview-card">
                <h3>Room Overview</h3>
                <p>Live room status based on current customer bookings.</p>
                <div className="manager-overview-grid">

                    
                    <article>
                        <span>Total Rooms</span>
                        <strong>{roomOverview.totalRooms}</strong>
                    </article>
                    <article>
                        <span>Booked Rooms</span>
                        <strong>{roomOverview.bookedRooms}</strong>
                    </article>
                    <article>
                        <span>Available Rooms</span>
                        <strong>{roomOverview.availableRooms}</strong>
                    </article>
                </div>
            </div>

            <div className="card">
                <h3>Room Management</h3>
                <p>{editingRoomId ? "Edit Room Record" : "Create Record"}</p>

                <form onSubmit={handleRoomSubmit}>
                    <div className="form-grid">
                        <div>
                            <label>Room Number</label>
                            <input value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="Ex: 101" required />
                        </div>
                        <div>
                            <label>Room Type</label>
                            <select value={roomForm.roomType} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })} required>
                                <option value="STANDARD">Standard</option>
                                <option value="DELUXE">Deluxe</option>
                                <option value="SUITE">Suite</option>
                                <option value="FAMILY">Family</option>
                            </select>
                        </div>
                        <div>
                            <label>Photo URL</label>
                            <input type="url" value={roomForm.photoUrl} onChange={(e) => setRoomForm({ ...roomForm, photoUrl: e.target.value })} placeholder="https://example.com/room.jpg" required />
                        </div>
                        <div>
                            <label>Capacity</label>
                            <input type="number" min="1" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} required />
                        </div>
                        <div>
                            <label>Total Rooms</label>
                            <input type="number" min="1" value={roomForm.totalRooms} onChange={(e) => setRoomForm({ ...roomForm, totalRooms: e.target.value })} placeholder="Ex: 4" required />
                        </div>
                        <div>
                            <label>Normal Price</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={roomForm.normalPrice}
                                onChange={(e) => setRoomForm({ ...roomForm, normalPrice: e.target.value })}
                                placeholder="Example: 12000"
                                required
                            />
                        </div>
                        <div>
                            <label>Weekend Price</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={roomForm.weekendPrice}
                                onChange={(e) => setRoomForm({ ...roomForm, weekendPrice: e.target.value })}
                                placeholder="Example: 14500"
                                required
                            />
                        </div>
                        <div>
                            <label>Seasonal Price (Optional)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={roomForm.seasonalPrice}
                                onChange={(e) => setRoomForm({ ...roomForm, seasonalPrice: e.target.value })}
                                placeholder="Example: 17000"
                            />
                        </div>
                        <div>
                            <label>Room Status</label>
                            <select value={roomForm.roomStatus} onChange={(e) => setRoomForm({ ...roomForm, roomStatus: e.target.value })} required>
                                <option value="AVAILABLE">Available</option>
                                <option value="RESERVED">Reserved</option>
                                <option value="OCCUPIED">Occupied</option>
                                <option value="CLEANING">Cleaning</option>
                                <option value="MAINTENANCE">Maintenance</option>
                            </select>
                        </div>
                        <div className="span-full">
                            <label>Room Description</label>
                            <textarea
                                rows="4"
                                value={roomForm.roomDescription}
                                onChange={(e) => setRoomForm({ ...roomForm, roomDescription: e.target.value })}
                                placeholder="Describe room features and facilities"
                                required
                            />
                        </div>
                    </div>

                    <div className="toolbar">
                        <button className="btn" type="submit">
                            {editingRoomId ? "Update Room" : "Create Record"}
                        </button>
                        {editingRoomId && (
                            <button
                                className="btn ghost"
                                type="button"
                                onClick={() => {
                                    setEditingRoomId(null);
                                    setRoomForm(initialRoomForm);
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                {roomMessage && <p className="success">{roomMessage}</p>}
                {roomError && <p className="error">{roomError}</p>}
            </div>

            <div className="card" style={{ marginTop: "16px" }}>
                <h3>{editingBookingId ? "Edit Room Booking" : "Create Room Booking"}</h3>
                <p>Reserve a room for a customer stay.</p>

                <form onSubmit={handleBookingSubmit}>
                    <div className="form-grid">
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
                            <input value={bookingForm.roomNumber} onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })} placeholder="204" required />
                        </div>
                        <div>
                            <label>Rooms to Book</label>
                            <input type="number" min="1" value={bookingForm.bookedRooms} onChange={(e) => setBookingForm({ ...bookingForm, bookedRooms: e.target.value })} placeholder="1" required />
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
                    </div>

                    <div className="toolbar">
                        <button className="btn" type="submit">
                            {editingBookingId ? "Update Booking" : "Create Booking"}
                        </button>
                        {editingBookingId && (
                            <button
                                className="btn ghost"
                                type="button"
                                onClick={() => {
                                    setEditingBookingId(null);
                                    setBookingForm(initialBookingForm);
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                {bookingMessage && <p className="success">{bookingMessage}</p>}
                {bookingError && <p className="error">{bookingError}</p>}
            </div>

            <div className="card" style={{ marginTop: "16px" }}>
                <h3>Latest Records</h3>
                <div className="latest-records-grid">
                    <section className="latest-records-panel">
                        <h4>Room Records</h4>
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.map((room) => (
                                        <tr key={room.id}>
                                            <td>{room.id}</td>
                                            <td>{room.roomNumber}</td>
                                            <td>{room.roomStatus}</td>
                                            <td>Rs. {Number(room.normalPrice || 0).toLocaleString()}</td>
                                            <td>
                                                <button className="btn small" type="button" onClick={() => editRoom(room)}>
                                                    Edit
                                                </button>
                                                <button className="btn danger small" type="button" onClick={() => removeRoom(room.id)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rooms.length === 0 && (
                                        <tr>
                                            <td colSpan="5">No room records yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="latest-records-panel">
                        <h4>Booking Records</h4>
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>{String(booking.bookingSequence ?? booking.id).padStart(2, "0")}</td>
                                            <td>{booking.bookingCustomer}</td>
                                            <td>{booking.bookingStatus}</td>
                                            <td>Rs. {Number(booking.amount || 0).toLocaleString()}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn small" type="button" onClick={() => editBooking(booking)}>
                                                        Edit
                                                    </button>
                                                    <button className="btn danger small" type="button" onClick={() => removeBooking(booking.id)}>
                                                        Delete
                                                    </button>
                                                    {booking.bookingStatus === "CANCELLATION_REQUESTED" && (
                                                        <button className="btn small" type="button" onClick={() => approveCancellation(booking.id)}>
                                                            Approve Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && (
                                        <tr>
                                            <td colSpan="5">No booking records yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

export default RoomManagementPage;
