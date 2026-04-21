import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/service";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);

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
