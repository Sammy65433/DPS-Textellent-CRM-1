import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignInAlt, FaEnvelope, FaLock } from "react-icons/fa";
import { loginUser } from "../api/authService";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const data = await loginUser(formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setStatus("Login successful.");
      navigate("/dashboard");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section login-page">
      <div className="container">
        <div className="login-card">
          <div className="login-icon">
            <FaSignInAlt />
          </div>

          <h1>Login</h1>
          <p className="login-text">
  Sign in to access the internal DPS outreach and CRM workspace.
</p>


          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email">
              <FaEnvelope />
              <span>Email</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">
              <FaLock />
              <span>Password</span>
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Signing In..." : "Login"}
            </button>

            {status && <p className="login-status">{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
