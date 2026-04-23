import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const user = await login({
                username: form.username.trim().toLowerCase(),
                password: form.password,
            });
            if (user.role === "STAFF_MEMBER") {
                navigate("/my-payroll");
            } else if (user.role === "CUSTOMER") {
                navigate("/view-rooms");
            } else if (user.role === "SUPER_ADMIN" || user.role === "MANAGER") {
                navigate("/dashboard");
            } else {
                navigate("/profile");
            }
        } catch (err) {
            if (!err.response) {
                setError("Cannot reach backend server. Please start backend and try again.");
            } else {
                setError(err.response?.data?.message || "Login failed");
            }
        }
    };
    return (
        <div className="login-wrap">
            <div className="login-card">
                <h1>Hotel Payroll Management</h1>
                <p>Sign in with your account</p>
                <form onSubmit={submit}>
                    <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                    <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    {error && <div className="error">{error}</div>}
                    <button className="btn" type="submit">
                        Login
                    </button>
                </form>
                <small>Demo password for seeded users: Password@123</small>
            </div>
        </div>
    );
}

export default LoginPage;
