import { useState } from "react";
import { createRoomBooking, createRoomRecord } from "../api/service";

const initialForm = {
    roomNumber: "",
    roomType: "STANDARD",
    photoUrl: "",
    roomDescription: "",
    capacity: 1,
    normalPrice: "",
    weekendPrice: "",
    seasonalPrice: "",
    roomStatus: "AVAILABLE",
};

function RoomManagementPage() {
    const [form, setForm] = useState(initialForm);
    const [bookingForm, setBookingForm] = useState({
        bookingCustomer: "",
        customerEmail: "",
        roomNumber: "",
        checkInDate: "",
        checkOutDate: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const payload = {
                roomNumber: form.roomNumber.trim(),
                roomType: form.roomType,
                photoUrl: form.photoUrl.trim(),
                roomDescription: form.roomDescription.trim(),
                capacity: Number(form.capacity),
                normalPrice: Number(form.normalPrice),
                weekendPrice: Number(form.weekendPrice),
                roomStatus: form.roomStatus,
            };

            if (form.seasonalPrice !== "" && form.seasonalPrice !== null) {
                payload.seasonalPrice = Number(form.seasonalPrice);
            }

            await createRoomRecord(payload);
            setMessage("Room record created successfully");
            setForm(initialForm);
        } catch (err) {
            const apiMsg = err?.response?.data?.message;
            setError(apiMsg || "Failed to create room record");
        }
    };

    const submitBooking = async (e) => {
        e.preventDefault();
        setBookingMessage("");
        setBookingError("");

        try {
            await createRoomBooking({
                bookingCustomer: bookingForm.bookingCustomer.trim(),
                customerEmail: bookingForm.customerEmail.trim(),
                roomNumber: bookingForm.roomNumber.trim(),
                checkInDate: bookingForm.checkInDate,
                checkOutDate: bookingForm.checkOutDate,
            });

            setBookingMessage("Room booking created successfully");
            setBookingForm({
                bookingCustomer: "",
                customerEmail: "",
                roomNumber: "",
                checkInDate: "",
                checkOutDate: "",
            });
        } catch (err) {
            const apiMsg = err?.response?.data?.message;
            setBookingError(apiMsg || "Failed to create room booking");
        }
    };

    return (
        <>
            <div className="card">
                <h3>Room Management</h3>
                <p>Create Record</p>

                <form onSubmit={submit}>
                    <div className="form-grid">
                        <div>
                            <label>Room Number</label>
                            <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="Ex: 101" required />
                        </div>
                        <div>
                            <label>Room Type</label>
                            <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} required>
                                <option value="STANDARD">Standard</option>
                                <option value="DELUXE">Deluxe</option>
                                <option value="SUITE">Suite</option>
                                <option value="FAMILY">Family</option>
                            </select>
                        </div>
                        <div>
                            <label>Photo URL</label>
                            <input type="url" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://example.com/room.jpg" required />
                        </div>
                        <div>
                            <label>Capacity</label>
                            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
                        </div>
                        <div>
                            <label>Normal Price</label>
                            <input type="number" min="0.01" step="0.01" value={form.normalPrice} onChange={(e) => setForm({ ...form, normalPrice: e.target.value })} required />
                        </div>
                        <div>
                            <label>Weekend Price</label>
                            <input type="number" min="0.01" step="0.01" value={form.weekendPrice} onChange={(e) => setForm({ ...form, weekendPrice: e.target.value })} required />
                        </div>
                        <div>
                            <label>Seasonal Price (Optional)</label>
                            <input type="number" min="0.01" step="0.01" value={form.seasonalPrice} onChange={(e) => setForm({ ...form, seasonalPrice: e.target.value })} />
                        </div>
                        <div>
                            <label>Room Status</label>
                            <select value={form.roomStatus} onChange={(e) => setForm({ ...form, roomStatus: e.target.value })} required>
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
                                value={form.roomDescription}
                                onChange={(e) => setForm({ ...form, roomDescription: e.target.value })}
                                placeholder="Describe room features and facilities"
                                required
                            />
                        </div>
                    </div>

                    <button className="btn" type="submit">
                        Create Record
                    </button>
                </form>

                {message && <p className="success">{message}</p>}
                {error && <p className="error">{error}</p>}
            </div>

            <div className="card" style={{ marginTop: "16px" }}>
                <h3>Create Room Booking</h3>
                <p>Reserve a room for a customer stay.</p>

                <form onSubmit={submitBooking}>
                    <div className="form-grid">
                        <div>
                            <label>Booking Customer</label>
                            <input
                                value={bookingForm.bookingCustomer}
                                onChange={(e) => setBookingForm({ ...bookingForm, bookingCustomer: e.target.value })}
                                placeholder="Customer User"
                                required
                            />
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
                            <input
                                value={bookingForm.roomNumber}
                                onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })}
                                placeholder="204"
                                required
                            />
                        </div>
                        <div>
                            <label>Check-In Date (mm/dd/yyyy)</label>
                            <input
                                type="date"
                                value={bookingForm.checkInDate}
                                onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Check-Out Date (mm/dd/yyyy)</label>
                            <input
                                type="date"
                                value={bookingForm.checkOutDate}
                                onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button className="btn" type="submit">
                        Create Booking
                    </button>
                </form>

                {bookingMessage && <p className="success">{bookingMessage}</p>}
                {bookingError && <p className="error">{bookingError}</p>}
            </div>
        </>
    );
}

export default RoomManagementPage;
