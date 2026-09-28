import { useEffect, useState } from "react";
import AppLayout from "./AppLayout";

const API_URL = import.meta.env.VITE_DPS_API_URL;

const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function Booking({ theme, onToggleTheme }) {
    const [month, setMonth] = useState(new Date());
    const [day, setDay] = useState(dateKey(new Date()));
    const [preparer, setPreparer] = useState("");
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [service, setService] = useState("");
    const [duration, setDuration] = useState(30);
    const [customer, setCustomer] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [appointments, setAppointments] = useState([]);
    const [appointmentsError, setAppointmentsError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${import.meta.env.VITE_API_URL}/api/staff/appointments`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`Could not load appointments (${response.status}).`);
                return response.json();
            })
            .then((data) => setAppointments(Array.isArray(data) ? data : []))
            .catch((error) => setAppointmentsError(error.message));
    }, [refreshKey]);

    useEffect(() => {
        setTime("");
        setSlots([]);
        setError("");

        if (!day || !service || !preparer) return;
        if (!API_URL) {
            setError("VITE_DPS_API_URL is missing.");
            return;
        }

        const controller = new AbortController();

        async function loadSlots() {
            setLoading(true);

            try {
                const params = new URLSearchParams({
                    date: day,
                    preparer,
                    duration_minutes: String(duration),
                });

                const response = await fetch(
                    `${API_URL}/api/appointments/availability?${params}`,
                    { signal: controller.signal }
                );


                if (!response.ok) {
                    throw new Error(`Availability request failed (${response.status}).`);
                }

                const data = await response.json();



                if (!Array.isArray(data.availableTimes)) {
                    throw new Error("Invalid availability response.");
                }
                setSlots(data.availableTimes);



            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
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

    async function handleBooking(event) {
        event.preventDefault();
        if (!time || !service || !preparer || submitting) return;

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_URL}/api/appointments`, {
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
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not book appointment.");
            }

            setSuccess("Appointment booked successfully.");
            setCustomer({ first_name: "", last_name: "", phone: "", email: "" });
            setTime("");
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setError(err.message);
            setRefreshKey((current) => current + 1);
        } finally {
            setSubmitting(false);
        }
    }


    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <main style={{ width: "100%", padding: 16 }}>
                <h1>Booking Calendar</h1>

                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <button
                        type="button"
                        onClick={() =>
                            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
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
                            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
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
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => (
                        <strong key={name} style={{ textAlign: "center" }}>
                            {name}
                        </strong>
                    ))}

                    {days.map((date) => {
                        const value = dateKey(date);

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setDay(value)}
                                style={{
                                    minHeight: 95,
                                    textAlign: "left",
                                    padding: 10,
                                    border: value === day ? "2px solid #175cd3" : "1px solid #ccc",
                                    borderRadius: 8,
                                    background:
                                        value === day
                                            ? "#dbeafe"
                                            : date.getMonth() === month.getMonth()
                                                ? "#fff"
                                                : "#f3f4f6",
                                }}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>

                <section style={{ marginTop: 24 }}>
                    <h2>{day}</h2>
                    <label htmlFor="booking-service">Service: </label>
                    <select
                        id="booking-service"
                        value={service}
                        onChange={(event) => setService(event.target.value)}
                    >
                        <option value="">Select a service</option>
                        <option value="Tax Preparation">Tax Preparation</option>
                        <option value="Copy & Fax Services">Copy & Fax Services</option>
                        <option value="Notary Public">Notary Public</option>
                        <option value="Translation Services">Translation Services</option>
                    </select>
                    <label htmlFor="duration" style={{ marginLeft: 12 }}>
                        Appointment length:{" "}
                    </label>
                    <select
                        id="duration"
                        value={duration}
                        onChange={(event) => {
                            setDuration(Number(event.target.value));
                            setTime("");
                        }}
                    >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                    </select>

                    {duration === 60 && (
                        <p role="note">
                            One-hour availability is not verified yet. Please confirm with the office
                            before booking.
                        </p>
                    )}

                    <label htmlFor="preparer">Preparer: </label>

                    <select
                        id="preparer"
                        value={preparer}
                        onChange={(event) => setPreparer(event.target.value)}
                    >
                        <option value="">Choose a preparer</option>
                        <option value="Pierre Polidor">Pierre Polidor</option>
                        <option value="Dalia Pierre">Dalia Pierre</option>
                        <option value="Severe Jacquet">Severe Jacquet</option>
                        <option value="Jean P Cifrant">Jean P Cifrant</option>
                        <option value="Ricot Casimir">Ricot Casimir</option>
                    </select>

                    {loading && <p>Loading available times...</p>}
                    {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}

                    {!loading && !error && service && preparer && slots.length === 0 && (
                        <p>No available times for this date.</p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {slots.map((slot) => (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                style={{
                                    padding: "8px 12px",
                                    border:
                                        time === slot ? "2px solid #175cd3" : "1px solid #ccc",
                                    borderRadius: 6,
                                }}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>
                    {time && (
                        <p>
                            Selected: {day} at {time} with {preparer} for {duration} minutes
                        </p>
                    )}


                    {time && (
                        <form onSubmit={handleBooking} style={{ marginTop: 20, maxWidth: 420 }}>
                            {["first_name", "last_name", "phone", "email"].map((field) => (
                                <label key={field} style={{ display: "block", marginBottom: 12 }}>
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
                                        style={{ display: "block", width: "100%", padding: 8 }}
                                    />
                                </label>
                            ))}
                            <button type="submit" disabled={submitting || loading}>
                                {submitting ? "Booking..." : "Book Appointment"}
                            </button>
                        </form>
                    )}

                    {success && <p role="status">{success}</p>}
                    

                    <h3>Appointments on {day}</h3>
                    {appointmentsError && <p role="alert">{appointmentsError}</p>}

                    {appointments
                        .filter((appointment) => appointment.appointment_date === day)
                        .map((appointment) => (
                            <div key={appointment.id}>
                                <strong>{appointment.appointment_time}</strong>{" "}
                                {appointment.first_name} {appointment.last_name} ·{" "}
                                {appointment.service} · {appointment.tax_preparer} ·{" "}
                                {appointment.duration_minutes ?? 30} minutes
                            </div>
                        ))}

                </section>

            </main>
        </AppLayout>
    );
}
