import { useEffect, useState } from "react";
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

    const insightLines = (items) => {
        if (!items || items.length === 0) return ["No bookings yet"];
        return items.map((item) => `Room ${item.roomNumber}: ${item.bookings} booking${item.bookings === 1 ? "" : "s"}`);
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
            {user?.role === "MANAGER" ? (
                <>
                    <div className="dashboard-manager-top-row">
                        <div className="card stat room-stat-card">
                            <h3>Payroll Records</h3>
                            <p>{summary?.totalPayrollRecords ?? 0}</p>
                        </div>
                        <div className="card stat room-stat-card">
                            <h3>Total Rooms</h3>
                            <p>{summary?.totalRooms ?? 0}</p>
                            <small className={changeClass(summary?.totalRoomsChangePercent)}>({formatChange(summary?.totalRoomsChangePercent)})</small>
                        </div>
                        <div className="card stat room-stat-card">
                            <h3>Room Bookings</h3>
                            <p>{summary?.roomBookings ?? 0}</p>
                            <small className={changeClass(summary?.roomBookingsChangePercent)}>({formatChange(summary?.roomBookingsChangePercent)})</small>
                        </div>
                    </div>
                    <div className="card stat">
                        <h3>Total Staff</h3>
                        <p>{summary?.totalStaff ?? 0}</p>
                    </div>
                    <div className="card stat">
                        <h3>Total Salary Paid</h3>
                        <p>Rs. {Number(summary?.totalSalaryPaid || 0).toLocaleString()}</p>
                    </div>
                    <div className="card room-insights-card">
                        <h3>Room Booking Insights</h3>
                        <div className="insight-columns">
                            <section className="insight-column">
                                <h4>Most Booked Rooms</h4>
                                <div className="insight-lines">
                                    {insightLines(summary?.mostBookedRooms).map((line, index) => (
                                        <p key={`most-line-${index}`}>{line}</p>
                                    ))}
                                </div>
                            </section>

                            <section className="insight-column">
                                <h4>Least Booked Rooms</h4>
                                <div className="insight-lines">
                                    {insightLines(summary?.leastBookedRooms).map((line, index) => (
                                        <p key={`least-line-${index}`}>{line}</p>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}

export default DashboardPage;
