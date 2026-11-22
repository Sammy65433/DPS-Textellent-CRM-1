import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

function ForgotPasswordPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setStatus("");
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Request failed.");
            setStatus(data.message || "If the account exists, a reset link has been sent.");
        } catch (err) {
            setStatus(err.message || "Request failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="section login-page">
            <div className="container">
                <div className="login-card">
                    <div className="login-logo-wrap">
                        <img
                            src="/dps-logo.png"
                            alt="DPS Professional Tax Services logo"
                            className="login-logo"
                        />
                    </div>

                    <div className="login-icon">
                        <FaKey />
                    </div>

                    <h1>Forgot Password</h1>
                    <p className="login-text">
                        Enter your email to receive a password reset link.
                    </p>

                    <form onSubmit={handleSubmit} className="login-form">
                        <label htmlFor="email">
                            <FaEnvelope />
                            <span>Email</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>

                        {status && <p className="login-status">{status}</p>}
                    </form>

                    <p className="login-forgot">
                        <Link to="/login">Back to login</Link>
                    </p>
                </div>
            </div>
        </section>
    );
}

export default ForgotPasswordPage;
