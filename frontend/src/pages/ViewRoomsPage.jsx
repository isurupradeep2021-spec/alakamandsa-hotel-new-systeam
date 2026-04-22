import { useEffect, useMemo, useState } from "react";
import { createRoomBooking, getRooms } from "../api/service";
import { useAuth } from "../context/AuthContext";

const ROOM_TYPE_FILTERS = ["ALL", "DELUXE", "SUITE", "STANDARD"];

function ViewRoomsPage() {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [roomType, setRoomType] = useState("ALL");
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");

    const loadRooms = () => {
        setLoading(true);
        setError("");

        getRooms()
            .then((res) => setRooms(res.data || []))
            .catch((err) => {
                const statusCode = err?.response?.status;
                if (statusCode === 401 || statusCode === 403) {
                    setError("Unable to load rooms. Please log in again with a customer account.");
                    return;
                }

                const apiMessage = err?.response?.data?.message;
                setError(apiMessage || "Failed to load rooms. Please ensure backend is running on port 8088.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRooms();
    }, []);

    const filteredRooms = useMemo(() => {
        return rooms.filter((room) => {
            const matchesType = roomType === "ALL" || room.roomType === roomType;
            return matchesType;
        });
    }, [rooms, roomType]);

    const formatType = (roomTypeValue) => roomTypeValue?.charAt(0) + roomTypeValue?.slice(1).toLowerCase();

    const handleBookRoom = async (room) => {
        setBookingMessage("");
        setBookingError("");

        const customerEmail = (user?.username || "").trim();
        if (!customerEmail || !customerEmail.includes("@")) {
            setBookingError("Unable to book room because your account email is unavailable.");
            return;
        }

        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date(today);
        checkOut.setDate(checkOut.getDate() + 2);
        const toIso = (date) => date.toISOString().slice(0, 10);

        try {
            await createRoomBooking({
                bookingCustomer: user?.fullName || "Customer",
                customerEmail,
                roomNumber: room.roomNumber,
                checkInDate: toIso(checkIn),
                checkOutDate: toIso(checkOut),
            });
            setBookingMessage(`Booking created successfully for Room ${room.roomNumber}.`);
        } catch (err) {
            const apiMessage = err?.response?.data?.message;
            setBookingError(apiMessage || "Failed to create booking.");
        }
    };

    return (
        <div className="card">
            <h3>View Rooms</h3>
            <p>Browse room options and view full room details created by the manager.</p>

            <div className="room-filter-shell">
                <div>
                    <label>Room Type</label>
                    <div className="filter-chips">
                        {ROOM_TYPE_FILTERS.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`chip ${roomType === filter ? "active" : ""}`}
                                onClick={() => setRoomType(filter)}
                            >
                                {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {bookingMessage && <p className="success">{bookingMessage}</p>}
            {bookingError && <p className="error">{bookingError}</p>}

            {loading && <p>Loading rooms...</p>}
            {error && (
                <div>
                    <p className="error">{error}</p>
                    <button className="btn ghost" type="button" onClick={loadRooms}>
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="room-gallery">
                    {filteredRooms.map((room) => (
                        <article key={room.id} className="room-card">
                            <img
                                src={room.photoUrl}
                                alt={`Room ${room.roomNumber}`}
                                onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/640x420?text=Room+Image";
                                }}
                            />
                            <div className="room-card-body">
                                <h4>{formatType(room.roomType)} - {room.roomStatus}</h4>
                                
                                <p className="room-title">Room {room.roomNumber}</p>
                                <p className="room-description">{room.roomDescription}</p>

                                <div className="room-feature-row">
                                    <span>{room.capacity} Guests</span>
                                    <span>LKR {Number(room.normalPrice || 0).toLocaleString()} / night</span>
                                </div>
                                <p className="room-stock-note">{room.roomStatus === "AVAILABLE" ? "Available now" : "Currently unavailable"}</p>

                                <div className="room-extra-prices">
                                    <p>Weekend: LKR {Number(room.weekendPrice || 0).toLocaleString()}</p>
                                    <p>Seasonal: {room.seasonalPrice ? `LKR ${Number(room.seasonalPrice).toLocaleString()}` : "N/A"}</p>
                                </div>

                                <button className="btn" type="button" onClick={() => handleBookRoom(room)}>
                                    Book This Room
                                </button>
                            </div>
                        </article>
                    ))}

                    {filteredRooms.length === 0 && <p>No rooms found for selected filters.</p>}
                </div>
            )}
        </div>
    );
}

export default ViewRoomsPage;
