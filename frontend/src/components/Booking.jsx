import { useEffect, useState } from "react";
import AppLayout from "./AppLayout";

const DPS_API_URL = import.meta.env.VITE_DPS_API_URL;
const CRM_API_URL = import.meta.env.VITE_API_URL;

const SERVICES = [
    "Tax Preparation",
    "Copy & Fax Services",
    "Notary Public",
    "Translation Services",
];

const PREPARERS = [
    "Pierre Polidor",
    "Dalia Pierre",
    "Severe Jacquet",
    "Jean P Cifrant",
    "Ricot Casimir",
];

const emptyCustomer = {
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
};

function dateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return `${date.toLocaleString("en-US", {
        month: "long",
    })} ${String(day).padStart(2, "0")} ${year}`;
}

export default function Booking({ theme, onToggleTheme }) {
    const [month, setMonth] = useState(new Date());
    const [day, setDay] = useState(dateKey(new Date()));
    const [service, setService] = useState("");
    const [preparer, setPreparer] = useState("");
    const [duration, setDuration] = useState(30);
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [customer, setCustomer] = useState(emptyCustomer);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [appointments, setAppointments] = useState([]);
    const [appointmentsError, setAppointmentsError] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [editing, setEditing] = useState(null);
    const [editError, setEditError] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token || !CRM_API_URL) {
            setAppointmentsError("CRM login or API URL is missing.");
            return;
        }

        const controller = new AbortController();

        async function loadAppointments() {
            try {
                const response = await fetch(
                    `${CRM_API_URL}/api/staff/appointments`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Could not load appointments (${response.status}).`
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setAppointments(Array.isArray(data) ? data : []);
                    setAppointmentsError("");
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    setAppointmentsError(err.message);
                }
            }
        }

        loadAppointments();
        return () => controller.abort();
    }, [refreshKey]);

    useEffect(() => {
        setTime("");
        setSlots([]);
        setError("");

        if (!day || !service || !preparer) return;

        if (!DPS_API_URL) {
            setError("VITE_DPS_API_URL is missing.");
            return;
        }

        const controller = new AbortController();

        async function loadSlots() {
            setLoadingSlots(true);

            try {
                const params = new URLSearchParams({
                    date: day,
                    preparer,
                    duration_minutes: String(duration),
                });

                const response = await fetch(
                    `${DPS_API_URL}/api/appointments/availability?${params}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(
                        `Availability request failed (${response.status}).`
                    );
                }

                const data = await response.json();

                if (!Array.isArray(data.availableTimes)) {
                    throw new Error("Invalid availability response.");
                }

                if (!controller.signal.aborted) {
                    setSlots(data.availableTimes);
                }
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoadingSlots(false);
            }
        }

        loadSlots();
        return () => controller.abort();
    }, [day, service, preparer, duration, refreshKey]);

    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());

    const days = Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
    });

    const activeAppointments = appointments.filter((appointment) =>
        ["booked", "confirmed"].includes(appointment.status)
    );

    const visibleAppointments = activeAppointments
        .filter(
            (appointment) =>
                showAll || appointment.appointment_date === day
        )
        .sort(
            (a, b) =>
                a.appointment_date.localeCompare(b.appointment_date) ||
                a.appointment_time.localeCompare(b.appointment_time)
        );

    async function handleBooking(event) {
        event.preventDefault();

        if (!time || !service || !preparer || submitting) return;

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${DPS_API_URL}/api/appointments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...customer,
                        service,
                        tax_preparer: preparer,
                        appointment_date: day,
                        appointment_time: time,
                        duration_minutes: duration,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not book appointment.");
            }

            setSuccess("Appointment booked successfully.");
            setCustomer(emptyCustomer);
            setTime("");
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message);
            setRefreshKey((current) => current + 1);
        } finally {
            setSubmitting(false);
        }
    }

    async function saveEdit(event) {
        event.preventDefault();

        if (!editing || savingEdit) return;

        setSavingEdit(true);
        setEditError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("CRM login required.");

            const response = await fetch(
                `${CRM_API_URL}/api/staff/appointments/${editing.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        service: editing.service,
                        tax_preparer: editing.tax_preparer,
                        appointment_date: editing.appointment_date,
                        appointment_time: editing.appointment_time,
                        duration_minutes: Number(editing.duration_minutes),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update appointment.");
            }

            setEditing(null);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setEditError(err.message);
        } finally {
            setSavingEdit(false);
        }
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <main style={{ width: "100%", padding: 16 }}>
                <h1>Booking Calendar</h1>

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setMonth(
                                new Date(month.getFullYear(), month.getMonth() - 1, 1)
                            )
                        }
                    >
                        Previous
                    </button>

                    <strong>
                        {month.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                        })}
                    </strong>

                    <button
                        type="button"
                        onClick={() =>
                            setMonth(
                                new Date(month.getFullYear(), month.getMonth() + 1, 1)
                            )
                        }
                    >
                        Next
                    </button>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        gap: 6,
                    }}
                >
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (name) => (
                            <strong key={name} style={{ textAlign: "center" }}>
                                {name}
                            </strong>
                        )
                    )}

                    {days.map((date) => {
                        const value = dateKey(date);
                        const count = activeAppointments.filter(
                            (appointment) =>
                                appointment.appointment_date === value
                        ).length;

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setDay(value);
                                    setShowAll(false);
                                    setSuccess("");
                                }}
                                style={{
                                    minHeight: 95,
                                    textAlign: "left",
                                    padding: 10,
                                    border:
                                        value === day
                                            ? "2px solid #175cd3"
                                            : "1px solid #ccc",
                                    borderRadius: 8,
                                    background:
                                        value === day
                                            ? "#dbeafe"
                                            : date.getMonth() === month.getMonth()
                                                ? "#fff"
                                                : "#f3f4f6",
                                }}
                            >
                                <strong>{date.getDate()}</strong>

                                {count > 0 && (
                                    <small style={{ display: "block", marginTop: 8 }}>
                                        {count} booked
                                    </small>
                                )}
                            </button>
                        );
                    })}
                </div>

                <section style={{ marginTop: 24 }}>
                    <h2>{formatDate(day)}</h2>

                    <label htmlFor="booking-service">Service: </label>
                    <select
                        id="booking-service"
                        value={service}
                        onChange={(event) => setService(event.target.value)}
                    >
                        <option value="">Select a service</option>
                        {SERVICES.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="duration" style={{ marginLeft: 12 }}>
                        Appointment length:{" "}
                    </label>
                    <select
                        id="duration"
                        value={duration}
                        onChange={(event) =>
                            setDuration(Number(event.target.value))
                        }
                    >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                    </select>

                    <label htmlFor="preparer" style={{ marginLeft: 12 }}>
                        Preparer:{" "}
                    </label>
                    <select
                        id="preparer"
                        value={preparer}
                        onChange={(event) => setPreparer(event.target.value)}
                    >
                        <option value="">Choose a preparer</option>
                        {PREPARERS.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>

                    {loadingSlots && <p>Loading available times...</p>}

                    {error && (
                        <p role="alert" style={{ color: "#b42318" }}>
                            {error}
                        </p>
                    )}

                    {!loadingSlots &&
                        !error &&
                        service &&
                        preparer &&
                        slots.length === 0 && (
                            <p>No available times for this date.</p>
                        )}

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 12,
                        }}
                    >
                        {slots.map((slot) => (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                style={{
                                    padding: "8px 12px",
                                    border:
                                        time === slot
                                            ? "2px solid #175cd3"
                                            : "1px solid #ccc",
                                    borderRadius: 6,
                                }}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    {time && (
                        <p>
                            Selected: {formatDate(day)} at {time} with {preparer}
                            {" "}for {duration} minutes
                        </p>
                    )}

                    {time && (
                        <form
                            onSubmit={handleBooking}
                            style={{ marginTop: 20, maxWidth: 420 }}
                        >
                            {["first_name", "last_name", "phone", "email"].map(
                                (field) => (
                                    <label
                                        key={field}
                                        style={{ display: "block", marginBottom: 12 }}
                                    >
                                        {field.replace("_", " ")}
                                        <input
                                            required
                                            type={
                                                field === "email"
                                                    ? "email"
                                                    : field === "phone"
                                                        ? "tel"
                                                        : "text"
                                            }
                                            value={customer[field]}
                                            onChange={(event) =>
                                                setCustomer((current) => ({
                                                    ...current,
                                                    [field]: event.target.value,
                                                }))
                                            }
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                padding: 8,
                                            }}
                                        />
                                    </label>
                                )
                            )}

                            <button
                                type="submit"
                                disabled={submitting || loadingSlots}
                            >
                                {submitting ? "Booking..." : "Book Appointment"}
                            </button>
                        </form>
                    )}

                    {success && <p role="status">{success}</p>}

                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            marginTop: 24,
                        }}
                    >
                        <h3 style={{ margin: 0 }}>
                            {showAll
                                ? "All Appointments"
                                : `Appointments on ${formatDate(day)}`}
                        </h3>

                        <button
                            type="button"
                            onClick={() => setShowAll((current) => !current)}
                        >
                            {showAll ? "Selected Day" : "All Appointments"}
                        </button>
                    </div>

                    {appointmentsError && (
                        <p role="alert">{appointmentsError}</p>
                    )}

                    {visibleAppointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            style={{ padding: "8px 0" }}
                        >
                            <strong>
                                {formatDate(appointment.appointment_date)} at{" "}
                                {appointment.appointment_time}
                            </strong>{" "}
                            {appointment.first_name} {appointment.last_name} ·{" "}
                            {appointment.service} · {appointment.tax_preparer} ·{" "}
                            {appointment.duration_minutes ?? 30} minutes{" "}

                            <button
                                type="button"
                                onClick={() => {
                                    setEditing({ ...appointment });
                                    setEditError("");
                                }}
                            >
                                Edit
                            </button>
                        </div>
                    ))}

                    {editing && (
                        <form
                            onSubmit={saveEdit}
                            style={{
                                maxWidth: 480,
                                marginTop: 24,
                                padding: 20,
                                border: "1px solid #ccc",
                                borderRadius: 10,
                            }}
                        >
                            <h3>
                                Edit {editing.first_name} {editing.last_name}
                            </h3>

                            <label style={{ display: "block", marginBottom: 12 }}>
                                Service
                                <select
                                    value={editing.service}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            service: event.target.value,
                                        })
                                    }
                                    style={{ display: "block", width: "100%" }}
                                >
                                    {SERVICES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: "block", marginBottom: 12 }}>
                                Preparer
                                <select
                                    value={editing.tax_preparer}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            tax_preparer: event.target.value,
                                        })
                                    }
                                    style={{ display: "block", width: "100%" }}
                                >
                                    {PREPARERS.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: "block", marginBottom: 12 }}>
                                Date
                                <input
                                    required
                                    type="date"
                                    value={editing.appointment_date}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            appointment_date: event.target.value,
                                        })
                                    }
                                    style={{ display: "block", width: "100%" }}
                                />
                            </label>

                            <label style={{ display: "block", marginBottom: 12 }}>
                                Time, for example 9:30 AM
                                <input
                                    required
                                    type="text"
                                    value={editing.appointment_time}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            appointment_time: event.target.value,
                                        })
                                    }
                                    style={{ display: "block", width: "100%" }}
                                />
                            </label>

                            <label style={{ display: "block", marginBottom: 12 }}>
                                Appointment length
                                <select
                                    value={editing.duration_minutes ?? 30}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            duration_minutes: Number(event.target.value),
                                        })
                                    }
                                    style={{ display: "block", width: "100%" }}
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                </select>
                            </label>

                            {editError && (
                                <p role="alert" style={{ color: "#b42318" }}>
                                    {editError}
                                </p>
                            )}

                            <button type="submit" disabled={savingEdit}>
                                {savingEdit ? "Saving..." : "Save Changes"}
                            </button>{" "}
                            <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => setEditing(null)}
                            >
                                Close
                            </button>
                        </form>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
