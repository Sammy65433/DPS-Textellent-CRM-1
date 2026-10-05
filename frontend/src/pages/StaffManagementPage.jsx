import { useState } from "react";
import AppLayout from "../components/AppLayout";

export default function StaffManagementPage({ theme, onToggleTheme }) {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    });
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/staff`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Invitation failed.");

            setMessage(data.message);
            setForm({ firstName: "", lastName: "", email: "" });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <main className="container py-4">
                <h1>Staff Management</h1>
                <form onSubmit={submit} className="d-grid gap-3" style={{ maxWidth: 480 }}>
                    {["firstName", "lastName", "email"].map((field) => (
                        <label key={field}>
                            {field === "firstName"
                                ? "First name"
                                : field === "lastName"
                                    ? "Last name"
                                    : "Work email"}
                            <input
                                className="form-control"
                                required
                                type={field === "email" ? "email" : "text"}
                                value={form[field]}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        [field]: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    ))}
                    <button className="btn btn-primary" disabled={saving}>
                        {saving ? "Sending..." : "Invite Staff"}
                    </button>
                    {message && <p role="status">{message}</p>}
                </form>
            </main>
        </AppLayout>
    );
}
