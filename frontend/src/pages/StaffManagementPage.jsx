import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";

const CRM_API = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(
  /\/$/,
  ""
);

export default function StaffManagementPage({ theme, onToggleTheme }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadStaff() {
    setLoadingStaff(true);
    try {
      const response = await fetch(`${CRM_API}/api/admin/staff`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not load staff.");
      setStaff(Array.isArray(data.staff) ? data.staff : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingStaff(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${CRM_API}/api/admin/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invitation failed.");

      setMessage(data.message);
      setForm({ firstName: "", lastName: "", email: "" });
      loadStaff();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(staffMember) {
    if (updatingId) return;
    setUpdatingId(staffMember._id || staffMember.id);
    setMessage("");
    try {
      const response = await fetch(
        `${CRM_API}/api/admin/staff/${encodeURIComponent(
          staffMember._id || staffMember.id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ active: !staffMember.active }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Update failed.");
      setMessage(data.message);
      loadStaff();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpdatingId(null);
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

        <h2 className="mt-5">Existing Staff</h2>
        {loadingStaff ? (
          <p>Loading staff...</p>
        ) : staff.length === 0 ? (
          <p className="text-muted">No staff accounts yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member._id || member.id}>
                    <td>{member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim()}</td>
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>
                      <span
                        className={`badge ${
                          member.active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${
                          member.active ? "btn-outline-danger" : "btn-outline-success"
                        }`}
                        disabled={updatingId === (member._id || member.id)}
                        onClick={() => toggleActive(member)}
                      >
                        {updatingId === (member._id || member.id)
                          ? "Updating..."
                          : member.active
                          ? "Deactivate"
                          : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AppLayout>
  );
}