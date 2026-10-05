import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function SetupPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/setup-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, password }),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Setup failed.");
            setMessage(data.message);
            setPassword("");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="container py-5" style={{ maxWidth: 480 }}>
            <h1>Set Your Password</h1>
            <form onSubmit={submit} className="d-grid gap-3">
                <label>
                    Password, at least 12 characters
                    <input
                        className="form-control"
                        type="password"
                        minLength={12}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </label>
                <button className="btn btn-primary" disabled={saving || !token}>
                    {saving ? "Saving..." : "Set Password"}
                </button>
            </form>
            {message && <p role="status" className="mt-3">{message}</p>}
            <Link to="/login">Go to login</Link>
        </main>
    );
}
