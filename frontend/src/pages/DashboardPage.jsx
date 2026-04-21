import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/service";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);

    const formatChange = (value) => {
        const numeric = Number(value || 0);
        const sign = numeric > 0 ? "+" : "";
        return `${sign}${numeric.toFixed(1)}% this week`;
    };

    const changeClass = (value) => {
        const numeric = Number(value || 0);
        if (numeric > 0) return "change-positive";
        if (numeric < 0) return "change-negative";
        return "change-neutral";
    };

    useEffect(() => {
        if (user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") {
            getDashboardSummary()
                .then((res) => setSummary(res.data))
                .catch(() => setSummary(null));
        }
    }, [user]);

    if (user?.role !== "SUPER_ADMIN" && user?.role !== "MANAGER") {
        return (
            <div className="card">
                <h3>Welcome, {user?.role}</h3>
                <p>Your module dashboard is ready.</p>
            </div>
        );
    }

    return (
        <div className="grid">
            <div className="card stat">
                <h3>Total Staff</h3>
                <p>{summary?.totalStaff ?? 0}</p>
            </div>
            <div className="card stat">
                <h3>Total Salary Paid</h3>
                <p>Rs. {Number(summary?.totalSalaryPaid || 0).toLocaleString()}</p>
            </div>
            <div className="card stat">
                <h3>Payroll Records</h3>
                <p>{summary?.totalPayrollRecords ?? 0}</p>
            </div>
            {user?.role === "MANAGER" && (
                <>
                    <div className="card stat">
                        <h3>Total Rooms</h3>
                        <p>{summary?.totalRooms ?? 0}</p>
                        <small className={changeClass(summary?.totalRoomsChangePercent)}>
                            ({formatChange(summary?.totalRoomsChangePercent)})
                        </small>
                    </div>
                    <div className="card stat">
                        <h3>Room Bookings</h3>
                        <p>{summary?.roomBookings ?? 0}</p>
                        <small className={changeClass(summary?.roomBookingsChangePercent)}>
                            ({formatChange(summary?.roomBookingsChangePercent)})
                        </small>
                    </div>
                    <div className="card">
                        <h3>Room Booking Insights</h3>
                        <div className="insight-grid">
                            <section>
                                <h4>Most Booked Rooms</h4>
                                <ul className="insight-list">
                                    {(summary?.mostBookedRooms || []).map((item) => (
                                        <li key={`most-${item.roomNumber}`}>
                                            <span>{item.roomNumber}</span>
                                            <strong>{item.bookings}</strong>
                                        </li>
                                    ))}
                                    {(summary?.mostBookedRooms || []).length === 0 && <li>No bookings yet</li>}
                                </ul>
                            </section>
                            <section>
                                <h4>Least Booked Rooms</h4>
                                <ul className="insight-list">
                                    {(summary?.leastBookedRooms || []).map((item) => (
                                        <li key={`least-${item.roomNumber}`}>
                                            <span>{item.roomNumber}</span>
                                            <strong>{item.bookings}</strong>
                                        </li>
                                    ))}
                                    {(summary?.leastBookedRooms || []).length === 0 && <li>No bookings yet</li>}
                                </ul>
                            </section>
                        </div>
                    </div>
                </>
            )}
            {user?.role === "MANAGER" && (
                <div className="card">
                    <h3>Room Management</h3>
                    <p>Create and maintain room records for booking operations.</p>
                    <Link className="btn inline-link" to="/rooms">
                        Open Create Record Form
                    </Link>
                </div>
            )}
        </div>
    );
}

export default DashboardPage;
