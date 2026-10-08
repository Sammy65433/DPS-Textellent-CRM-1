import { useEffect, useRef, useState } from "react";
import AppLayout from "./AppLayout";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";



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

const EMPTY_CUSTOMER = {
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

function timeToInput(value) {
    const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(value || "");
    if (!match) return "";

    const hour = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function inputToTime(value) {
    const [hours, minutes] = value.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function Booking({ theme, onToggleTheme }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedAppointmentIds, setSelectedAppointmentIds] = useState([]);


    const [month, setMonth] = useState(new Date());
    const [day, setDay] = useState(dateKey(new Date()));
    const [service, setService] = useState("");
    const [preparer, setPreparer] = useState("");
    const [duration, setDuration] = useState(30);
    const [visitFormat, setVisitFormat] = useState("");
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [customer, setCustomer] = useState(() => ({
        ...EMPTY_CUSTOMER,
        ...(location.state?.customer || {}),
    }));

    const [submitting, setSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");

    const [appointments, setAppointments] = useState([]);
    const [appointmentsError, setAppointmentsError] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [editing, setEditing] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");
    const editFormRef = useRef(null);

    const [cancellingId, setCancellingId] = useState(null);
    const [cancelMessage, setCancelMessage] = useState("");
    const [cancelError, setCancelError] = useState("");

    const [importingId, setImportingId] = useState(null);
    const [contactMessage, setContactMessage] = useState("");
    const [contactError, setContactError] = useState("");



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
                    throw new Error(`Could not load appointments (${response.status}).`);
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setAppointments(Array.isArray(data) ? data : []);
                    setAppointmentsError("");
                }
            } catch (err) {
                if (err.name !== "AbortError") setAppointmentsError(err.message);
            }
        }

        loadAppointments();
        return () => controller.abort();
    }, [refreshKey]);

    useEffect(() => {
        setTime("");
        setSlots([]);
        setBookingError("");

        if (!day || !service || !preparer) return;

        if (!CRM_API_URL) {
            setBookingError("VITE_API_URL is missing.");
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
                    `${CRM_API_URL}/api/staff/appointments/availability?${params}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                        signal: controller.signal,
                    }
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

                if (!controller.signal.aborted) setSlots(data.availableTimes);
            } catch (err) {
                if (err.name !== "AbortError") setBookingError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoadingSlots(false);
            }
        }

        loadSlots();
        return () => controller.abort();
    }, [day, service, preparer, duration, refreshKey]);

    useEffect(() => {
        if (editing) {
            editFormRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [editing?.id]);

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
        if (submitting) return;

        if (!service || !preparer || !time || !visitFormat) {
            setBookingError("Select a service, preparer, time, and visit format.");
            return;
        }


        setSubmitting(true);
        setBookingError("");
        setBookingSuccess("");

        try {
            const response = await fetch(`${CRM_API_URL}/api/staff/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    ...customer,
                    service,
                    tax_preparer: preparer,
                    appointment_date: day,
                    appointment_time: time,
                    duration_minutes: duration,
                    visit_format: visitFormat,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not book appointment.");
            }

            setBookingSuccess("Appointment booked successfully.");
            setCustomer(EMPTY_CUSTOMER);
            setTime("");
            setRefreshKey((current) => current + 1);
            setVisitFormat("");

        } catch (err) {
            setBookingError(err.message);
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
        setEditSuccess("");

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

            setEditSuccess("Appointment changes saved successfully.");
            setEditing(null);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setEditError(err.message);
        } finally {
            setSavingEdit(false);
        }
    }

    async function cancelBooking(appointment) {
        const name = `${appointment.first_name} ${appointment.last_name}`;
        if (
            !window.confirm(
                `Are you sure you want to cancel ${name}'s appointment? This will notify the customer.`
            )
        ) return;


        setCancellingId(appointment.id);
        setCancelMessage("");
        setCancelError("");

        try {
            const response = await fetch(
                `${CRM_API_URL}/api/staff/appointments/${appointment.id}/cancel`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not cancel appointment.");
            }

            setCancelMessage("Appointment cancelled successfully.");
            setEditing(null);
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setCancelError(err.message);
        } finally {
            setCancellingId(null);
        }
    }

    async function addToContacts(appointment) {
        setImportingId(appointment.id);
        setContactMessage("");
        setContactError("");

        try {
            const response = await fetch(
                `${CRM_API_URL}/api/contacts/from-appointment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ appointmentId: appointment.id }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not add contact.");
            }

            setContactMessage(data.message || "Contact added.");
        } catch (err) {
            setContactError(err.message);
        } finally {
            setImportingId(null);
        }
    }
    function openCampaignDraft(appointmentIds) {
        navigate("/campaigns", {
            state: { appointmentIds },
        });
    }


    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <main className="booking-page">
                <div className="booking-toolbar">
                    <div>
                        <h1>Booking Calendar</h1>
                        <p>View appointments and book visits for DPS customers.</p>
                    </div>
                </div>

                <div className="booking-workspace">
                    <section className="booking-panel" aria-label="Appointment calendar">
                        <div className="booking-month-controls">
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

                        <div className="booking-calendar">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => (
                                <strong className="booking-weekday" key={name}>
                                    {name}
                                </strong>
                            ))}
                            {days.map((date) => {
                                const value = dateKey(date);
                                const count = activeAppointments.filter(
                                    (appointment) => appointment.appointment_date === value
                                ).length;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`booking-day ${value === day ? "selected" : ""} ${date.getMonth() !== month.getMonth() ? "outside" : ""
                                            }`}
                                        onClick={() => {
                                            setDay(value);
                                            setShowAll(false);
                                            setBookingSuccess("");
                                        }}
                                        aria-label={`${formatDate(value)}, ${count} appointments`}
                                        aria-pressed={value === day}
                                    >
                                        <strong>{date.getDate()}</strong>
                                        {count > 0 && (
                                            <span className="booking-count">{count} booked</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="booking-panel booking-side-panel">
                        <h2>{formatDate(day)}</h2>

                        <div className="booking-filters">
                            <label className="booking-filter" htmlFor="booking-service">
                                Service
                                <select
                                    id="booking-service"
                                    value={service}
                                    onChange={(event) => setService(event.target.value)}
                                >
                                    <option value="">Select a service</option>
                                    {SERVICES.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="booking-filter" htmlFor="booking-duration">
                                Appointment length
                                <select
                                    id="booking-duration"
                                    value={duration}
                                    onChange={(event) => setDuration(Number(event.target.value))}
                                >
                                    <option value={10}>10 minutes</option>
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>

                                </select>
                            </label>

                            <label className="booking-filter" htmlFor="booking-preparer">
                                Preparer
                                <select
                                    id="booking-preparer"
                                    value={preparer}
                                    onChange={(event) => setPreparer(event.target.value)}
                                >
                                    <option value="">Choose a preparer</option>
                                    {PREPARERS.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="booking-filter" htmlFor="booking-visit-format">
                                How would you like to meet?
                                <select
                                    id="booking-visit-format"
                                    value={visitFormat}
                                    onChange={(event) => setVisitFormat(event.target.value)}
                                >
                                    <option value="">Select a visit format</option>
                                    <option value="in_person">In person</option>
                                    <option value="phone">Over the phone</option>
                                    <option value="virtual">Virtual/online</option>
                                </select>
                            </label>

                        </div>

                        {loadingSlots && <p>Loading available times...</p>}
                        {bookingError && (
                            <p className="booking-status error" role="alert">{bookingError}</p>
                        )}
                        {!loadingSlots &&
                            !bookingError &&
                            service &&
                            preparer &&
                            slots.length === 0 && <p>No available times for this date.</p>}

                        <div className="booking-times">
                            {slots.map((slot) => (
                                <button
                                    key={slot}
                                    type="button"
                                    className={`booking-time ${time === slot ? "selected" : ""}`}
                                    onClick={() => setTime(slot)}
                                    aria-pressed={time === slot}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>

                        {time && (
                            <>
                                <p>
                                    Selected: {formatDate(day)} at {time} with {preparer} for{" "}
                                    {duration} minutes
                                </p>
                                <form className="booking-customer-form" onSubmit={handleBooking}>
                                    {[
                                        ["first_name", "First name", "text"],
                                        ["last_name", "Last name", "text"],
                                        ["phone", "Phone", "tel"],
                                        ["email", "Email", "email"],
                                    ].map(([field, label, type]) => (
                                        <label className="booking-field" key={field}>
                                            {label}
                                            <input
                                                required
                                                type={type}
                                                value={customer[field]}
                                                onChange={(event) =>
                                                    setCustomer((current) => ({
                                                        ...current,
                                                        [field]: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>
                                    ))}
                                    <button
                                        className="booking-submit"
                                        type="submit"
                                        disabled={submitting || loadingSlots}
                                    >
                                        {submitting ? "Booking..." : "Book Appointment"}
                                    </button>
                                </form>
                            </>
                        )}
                        {bookingSuccess && (
                            <p className="booking-status" role="status">{bookingSuccess}</p>
                        )}
                    </section>
                </div>

                <section className="booking-panel">
                    <div className="booking-list-heading">
                        <h2>
                            {showAll ? "All Appointments" : `Appointments on ${formatDate(day)}`}
                        </h2>
                        <button type="button" onClick={() => setShowAll((current) => !current)}>
                            {showAll ? "Selected Day" : "All Appointments"}
                        </button>
                    </div>

                    {appointmentsError && (
                        <p className="booking-status error" role="alert">{appointmentsError}</p>
                    )}
                    {editSuccess && (
                        <p className="booking-status" role="status">{editSuccess}</p>
                    )}
                    {cancelMessage && (
                        <p className="booking-status" role="status">{cancelMessage}</p>
                    )}
                    {cancelError && (
                        <p className="booking-status error" role="alert">{cancelError}</p>
                    )}
                    {contactMessage && (
                        <p className="booking-status" role="status">{contactMessage}</p>
                    )}
                    {contactError && (
                        <p className="booking-status error" role="alert">{contactError}</p>
                    )}

                    {visibleAppointments.length === 0 && !appointmentsError && (
                        <p>No active appointments shown.</p>
                    )}
                    <div className="booking-actions">
                        <button
                            type="button"
                            disabled={selectedAppointmentIds.length === 0}
                            onClick={() => openCampaignDraft(selectedAppointmentIds)}
                        >
                            Create Group Campaign ({selectedAppointmentIds.length})
                        </button>
                    </div>

                    {visibleAppointments.map((appointment) => (
                        <article className="booking-appointment" key={appointment.id}>
                            <div>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedAppointmentIds.includes(appointment.id)}
                                        onChange={(event) =>
                                            setSelectedAppointmentIds((current) =>
                                                event.target.checked
                                                    ? [...current, appointment.id]
                                                    : current.filter((id) => id !== appointment.id)
                                            )
                                        }
                                        aria-label={`Select appointment for ${appointment.first_name} ${appointment.last_name}`}
                                    />
                                </label>

                                <strong>
                                    {formatDate(appointment.appointment_date)} at{" "}
                                    {appointment.appointment_time}
                                </strong>
                                <p>{appointment.first_name} {appointment.last_name}</p>
                                <p>
                                    {appointment.service} · {appointment.tax_preparer} ·{" "}
                                    {appointment.duration_minutes ?? 30} minutes
                                </p>
                                <p>
                                    Visit:{" "}
                                    {appointment.visit_format === "in_person"
                                        ? "In person"
                                        : appointment.visit_format === "phone"
                                            ? "Over the phone"
                                            : appointment.visit_format === "virtual"
                                                ? "Virtual/online"
                                                : "Not specified"}
                                </p>

                            </div>
                            <div className="booking-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing({ ...appointment });
                                        setEditError("");
                                        setEditSuccess("");
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="cancel-button"
                                    type="button"
                                    disabled={cancellingId === appointment.id}
                                    onClick={() => cancelBooking(appointment)}
                                >
                                    {cancellingId === appointment.id ? "Cancelling..." : "Cancel"}
                                </button>
                                <button
                                    type="button"
                                    disabled={importingId === appointment.id}
                                    onClick={() => addToContacts(appointment)}
                                >
                                    {importingId === appointment.id ? "Adding..." : "Add to Contacts"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => openCampaignDraft([appointment.id])}
                                >
                                    Create Personal Campaign
                                </button>

                            </div>
                        </article>
                    ))}

                    {editing && (
                        <form className="booking-edit-form" ref={editFormRef} onSubmit={saveEdit}>
                            <h3>Edit {editing.first_name} {editing.last_name}</h3>

                            <label className="booking-field">
                                Service
                                <select
                                    value={editing.service}
                                    onChange={(event) =>
                                        setEditing({ ...editing, service: event.target.value })
                                    }
                                >
                                    {SERVICES.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="booking-field">
                                Preparer
                                <select
                                    value={editing.tax_preparer}
                                    onChange={(event) =>
                                        setEditing({ ...editing, tax_preparer: event.target.value })
                                    }
                                >
                                    {PREPARERS.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="booking-field">
                                Date and time
                                <input
                                    required
                                    type="datetime-local"
                                    step="60"
                                    value={
                                        editing.appointment_date && editing.appointment_time
                                            ? `${editing.appointment_date}T${timeToInput(
                                                editing.appointment_time
                                            )}`
                                            : ""
                                    }
                                    onChange={(event) => {
                                        if (!event.target.value) return;
                                        const [newDate, newTime] = event.target.value.split("T");
                                        setEditing({
                                            ...editing,
                                            appointment_date: newDate,
                                            appointment_time: inputToTime(newTime),
                                        });
                                    }}
                                />
                            </label>

                            <label className="booking-field">
                                Appointment length
                                <select
                                    value={editing.duration_minutes ?? 30}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            duration_minutes: Number(event.target.value),
                                        })
                                    }
                                >
                                    <option value={10}>10 minutes</option>
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>

                                </select>
                            </label>

                            {editError && (
                                <p className="booking-status error" role="alert">{editError}</p>
                            )}
                            <div className="booking-actions">
                                <button className="booking-submit" type="submit" disabled={savingEdit}>
                                    {savingEdit ? "Saving..." : "Save Changes"}
                                </button>
                                <button type="button" disabled={savingEdit} onClick={() => setEditing(null)}>
                                    Close
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
