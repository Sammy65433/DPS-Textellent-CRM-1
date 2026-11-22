import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

function ResetPasswordPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setStatus("");
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Reset failed.");
            setStatus(data.message || "Password reset. You can now log in.");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setStatus(err.message || "Reset failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="section login-page">
            <div className="container">
            <div className="login-card" style={{ maxWidth: 480, margin: "0 auto" }}>
                <div className="login-logo-wrap"><img src="/dps-logo.png" alt="DPS" className="login-logo" /></div>
                <h1 style={{ fontSize: "1.5rem" }}>Reset Password</h1>
                <p className="login-text">Set a new password for your CRM account.</p>
                {!token ? (
                    <p className="text-danger">Missing reset token.</p>
                ) : (
                    <form onSubmit={handleSubmit} className="d-grid gap-3">
                        <label>
                            New password (at least 12 characters)
                            <input
                                className="form-control"
                                type="password"
                                minLength={12}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </label>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                        {status && <p className="login-status">{status}</p>}
                    </form>
                )}
                <Link to="/login">Back to login</Link>
            </div>
            </div>
        </section>
    );
}

export default ResetPasswordPage;
