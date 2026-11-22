import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { Link } from "react-router-dom";

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
            <div className="login-card" style={{ maxWidth: 480, margin: "0 auto" }}>
                <div className="login-logo-wrap"><img src="/dps-logo.png" alt="DPS" className="login-logo" /></div>
                <h1 style={{ fontSize: "1.5rem" }}>Forgot Password</h1>
                <p className="login-text">Reset your CRM password.</p>
                <form onSubmit={handleSubmit} className="d-grid gap-3">
                    <label>
                        Email
                        <input
                            className="form-control"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                    {status && <p className="login-status">{status}</p>}
                    <Link to="/login">Back to login</Link>
                </form>
            </div>
            </div>
        </section>
    );
}

export default ForgotPasswordPage;
