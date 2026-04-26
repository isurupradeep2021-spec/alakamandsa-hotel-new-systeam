import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

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
      <div className="login-lux-stage">
        <div className="login-lux-backdrop" />
        <div className="login-lux-orb login-lux-orb-one" />
        <div className="login-lux-orb login-lux-orb-two" />
        <div className="login-lux-grid" />

        <section className="login-lux-panel">
          <div className="login-lux-shine" />
          <div className="login-lux-head">
            <span className="login-lux-mark">ALAKAMANDA</span>
            <h1>AI Assistant</h1>
          </div>

          <form onSubmit={submit}>
            <label className="login-field">
              <span>Username</span>
              <input
                placeholder="Enter username"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>

            {error && <div className="error">{error}</div>}

            <button className="btn login-submit" type="submit">
              Enter
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
