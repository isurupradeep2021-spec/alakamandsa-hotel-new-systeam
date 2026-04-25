import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGIN_ALIAS_MAP = {
    super_admin: "superadmin",
    "super-admin": "superadmin",
    "super admin": "superadmin",
    manager: "manager",
    staff_member: "staff",
    "staff-member": "staff",
    "staff member": "staff",
    customer: "customer",
    restaurant_manager: "restaurant-manager",
    "restaurant-manager": "restaurant-manager",
    "restaurant manager": "restaurant-manager",
    event_manager: "event-manager",
    "event-manager": "event-manager",
    "event manager": "event-manager",
};

function normalizeLoginUsername(rawUsername) {
    const normalized = rawUsername.trim().toLowerCase();
    return LOGIN_ALIAS_MAP[normalized] || normalized;
}

function extractLoginErrorMessage(err) {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (err?.response?.status === 401) return "Invalid username or password";
    if (err?.response?.statusText) return err.response.statusText;
    return "Login failed";
}

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

<<<<<<< Updated upstream
  const submit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const user = await login({
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });

      if (user.role === "STAFF_MEMBER") navigate("/my-payroll");
      else if (user.role === "CUSTOMER") navigate("/view-rooms");
      else if (user.role === "RESTAURANT_MANAGER") navigate("/table-reservations");
      else if (user.role === "EVENT_MANAGER") navigate("/dashboard");
      else if (user.role === "SUPER_ADMIN" || user.role === "MANAGER") navigate("/dashboard");
      else navigate("/profile");
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
          <input
            placeholder="Username"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          {error && <div className="error">{error}</div>}
          <button className="btn" type="submit">
            Login
          </button>
        </form>
        <small>Demo password for seeded users: Password@123</small>
      </div>
    </div>
  );
=======
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const user = await login({
                username: normalizeLoginUsername(form.username),
                password: form.password,
            });

            if (user.role === "STAFF_MEMBER") navigate("/my-payroll");
            else if (user.role === "CUSTOMER") navigate("/view-rooms");
            else if (user.role === "RESTAURANT_MANAGER") navigate("/table-reservations");
            else if (user.role === "EVENT_MANAGER") navigate("/event-booking-manager");
            else if (user.role === "SUPER_ADMIN" || user.role === "MANAGER") navigate("/dashboard");
            else navigate("/profile");
        } catch (err) {
            if (!err.response) {
                setError("Cannot reach backend server. Please start backend and try again.");
            } else {
                setError(extractLoginErrorMessage(err));
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
>>>>>>> Stashed changes
}

export default LoginPage;
