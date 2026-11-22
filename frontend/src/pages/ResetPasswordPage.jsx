import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaKey } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

function ResetPasswordPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

                    <h1>Reset Password</h1>
                    <p className="login-text">
                        Set a new password for your CRM account.
                    </p>

                    {!token ? (
                        <p className="login-status">Missing reset token.</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="login-form">
                            <label htmlFor="password">
                                <FaLock />
                                <span>New Password</span>
                            </label>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                minLength={12}
                                required
                                placeholder="At least 12 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label className="login-show-password">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={(event) => setShowPassword(event.target.checked)}
                                />
                                Show password
                            </label>

                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>

                            {status && <p className="login-status">{status}</p>}
                        </form>
                    )}

                    <p className="login-forgot">
                        <Link to="/login">Back to login</Link>
                    </p>
                </div>
            </div>
        </section>
    );
}

export default ResetPasswordPage;
