import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "./AppLayout";

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

function dateFromKey(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(value) {
    if (!value) return "";
    return dateFromKey(value).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function addDays(value, amount) {
    const date = dateFromKey(value);
    date.setDate(date.getDate() + amount);
    return dateKey(date);
}

function startOfWeek(value) {
    const date = dateFromKey(value);
    date.setDate(date.getDate() - date.getDay());
    return dateKey(date);
}

function shiftMonth(value, amount) {
    const date = dateFromKey(value);
    const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + amount + 1,
        0
    ).getDate();

    return dateKey(
        new Date(
            date.getFullYear(),
            date.getMonth() + amount,
            Math.min(date.getDate(), lastDay)
        )
    );
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

function appointmentTimestamp(appointment) {
    return `${appointment.appointment_date}T${timeToInput(appointment.appointment_time) || "00:00"
        }`;
}

function visitLabel(value) {
    if (value === "in_person") return "In person";
    if (value === "phone") return "Over the phone";
    if (value === "virtual") return "Virtual/online";
    return "Not specified";
}

export default function Booking({ theme, onToggleTheme }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [view, setView] = useState("month");
    const [day, setDay] = useState(() => dateKey(new Date()));
    const [openedAppointmentId, setOpenedAppointmentId] = useState(null);
    const [selectedAppointmentIds, setSelectedAppointmentIds] = useState([]);

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
        setBookingError("");

        if (!day || !service || !preparer || day < dateKey(new Date())) return;

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
                    throw new Error(`Availability request failed (${response.status}).`);
                }

                const data = await response.json();

                if (!Array.isArray(data.availableTimes)) {
                    throw new Error("Invalid availability response.");
                }

                if (!controller.signal.aborted) {
                    setSlots(
                        data.availableTimes.filter((slot) => {
                            if (day !== dateKey(new Date())) return true;

                            const inputTime = timeToInput(slot);
                            return (
                                inputTime &&
                                new Date(`${day}T${inputTime}`).getTime() > Date.now()
                            );
                        })
                    );
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    setBookingError(err.message);
                }
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

    const activeAppointments = appointments
        .filter((appointment) =>
            ["booked", "confirmed"].includes(appointment.status)
        )
        .sort((a, b) =>
            appointmentTimestamp(a).localeCompare(appointmentTimestamp(b))
        );

    const appointmentsForDate = (value) =>
        activeAppointments.filter(
            (appointment) => appointment.appointment_date === value
        );

    const selectedDate = dateFromKey(day);
    const monthStart = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
    );
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(1 - monthStart.getDay());

    const monthDays = Array.from({ length: 42 }, (_, index) => {
        const date = new Date(calendarStart);
        date.setDate(calendarStart.getDate() + index);
        return date;
    });

    const weekStart = startOfWeek(day);
    const weekDays = Array.from({ length: 7 }, (_, index) =>
        addDays(weekStart, index)
    );

    const dailyAppointments = appointmentsForDate(day);
    const visibleAppointments = showAll
        ? activeAppointments
        : dailyAppointments;

    const openedAppointment = dailyAppointments.find(
        (appointment) => String(appointment.id) === String(openedAppointmentId)
    );

    function selectDay(value) {
        setDay(value);
        setShowAll(false);
        setOpenedAppointmentId(null);
        setBookingSuccess("");
    }

    function moveCalendar(direction) {
        if (view === "day") {
            selectDay(addDays(day, direction));
        } else if (view === "week") {
            selectDay(addDays(day, direction * 7));
        } else {
            selectDay(shiftMonth(day, direction));
        }
    }

    function moveYear(direction) {
        const date = dateFromKey(day);
        const targetYear = date.getFullYear() + direction;
        const lastDay = new Date(
            targetYear,
            date.getMonth() + 1,
            0
        ).getDate();

        selectDay(
            dateKey(
                new Date(
                    targetYear,
                    date.getMonth(),
                    Math.min(date.getDate(), lastDay)
                )
            )
        );
    }

    function openAppointment(appointment) {
        setDay(appointment.appointment_date);
        setOpenedAppointmentId(appointment.id);
        setShowAll(false);
    }

    async function handleBooking(event) {
        event.preventDefault();
        if (submitting) return;

        if (!service || !preparer || !time || !visitFormat) {
            setBookingError("Select a service, preparer, time, and visit format.");
            return;
        }

        if (day < dateKey(new Date())) {
            setBookingError("Choose today or a future date.");
            return;
        }

        const chosenTime = timeToInput(time);

        if (
            day === dateKey(new Date()) &&
            (!chosenTime ||
                new Date(`${day}T${chosenTime}`).getTime() <= Date.now())
        ) {
            setBookingError("Choose a future time.");
            return;
        }

        setSubmitting(true);
        setBookingError("");
        setBookingSuccess("");

        try {
            const response = await fetch(
                `${CRM_API_URL}/api/staff/appointments`,
                {
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
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not book appointment.");
            }

            setBookingSuccess("Appointment booked successfully.");
            setCustomer({ ...EMPTY_CUSTOMER });
            setTime("");
            setVisitFormat("");
            setRefreshKey((current) => current + 1);
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
                        visit_format: editing.visit_format || null,
                        message: editing.message || "",

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
        ) {
            return;
        }

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
            setOpenedAppointmentId(null);
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
        navigate("/campaigns", { state: { appointmentIds } });
    }

    function renderAppointmentActions(appointment) {
        return (
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
        );
    }

    function renderCalendarAppointment(appointment) {
        return (
            <button
                key={appointment.id}
                type="button"
                className="booking-calendar-event"
                onClick={() => openAppointment(appointment)}
                title={`${appointment.appointment_time} - ${appointment.first_name} ${appointment.last_name}`}
            >
                <span>{appointment.appointment_time}</span>
                <span>
                    {appointment.first_name} {appointment.last_name}
                </span>
            </button>
        );
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
                    <section
                        className="booking-panel booking-calendar-panel"
                        aria-label="Appointment calendar"
                    >
                        <div className="booking-calendar-header">
                            <div className="booking-month-controls">
                                <button type="button" onClick={() => moveYear(-1)}>
                                    « Year
                                </button>

                                <button type="button" onClick={() => moveCalendar(-1)}>
                                    Previous
                                </button>

                                <strong>
                                    {view === "month"
                                        ? selectedDate.toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric",
                                        })
                                        : view === "week"
                                            ? `${formatDate(weekStart)} - ${formatDate(
                                                addDays(weekStart, 6)
                                            )}`
                                            : formatDate(day)}
                                </strong>

                                <button
                                    type="button"
                                    onClick={() => selectDay(dateKey(new Date()))}
                                >
                                    Today
                                </button>

                                <button type="button" onClick={() => moveCalendar(1)}>
                                    Next
                                </button>

                                <button type="button" onClick={() => moveYear(1)}>
                                    Year »
                                </button>
                            </div>

                            <div
                                className="booking-view-switch"
                                role="group"
                                aria-label="Calendar view"
                            >
                                {["day", "week", "month"].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setView(option)}
                                        aria-pressed={view === option}
                                    >
                                        {option[0].toUpperCase() + option.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {view === "month" && (
                            <div className="booking-calendar">
                                {[
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                ].map((name) => (
                                    <strong className="booking-weekday" key={name}>
                                        {name}
                                    </strong>
                                ))}

                                {monthDays.map((date) => {
                                    const value = dateKey(date);
                                    const count = appointmentsForDate(value).length;

                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            className={`booking-day ${value === day ? "selected" : ""
                                                } ${date.getMonth() !== selectedDate.getMonth()
                                                    ? "outside"
                                                    : ""
                                                }`}
                                            onClick={() => selectDay(value)}
                                            aria-label={`${formatDate(value)}, ${count} appointments`}
                                            aria-pressed={value === day}
                                        >
                                            <strong>{date.getDate()}</strong>
                                            {count > 0 && (
                                                <span className="booking-count">
                                                    {count} booked
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {view === "week" && (
                            <div className="booking-week-view">
                                {weekDays.map((value) => {
                                    const daily = appointmentsForDate(value);

                                    return (
                                        <div
                                            className={`booking-week-day ${value === day ? "selected" : ""
                                                }`}
                                            key={value}
                                        >
                                            <button
                                                type="button"
                                                className="booking-week-date"
                                                onClick={() => selectDay(value)}
                                                aria-pressed={value === day}
                                            >
                                                {dateFromKey(value).toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                                <span>{daily.length} booked</span>
                                            </button>

                                            {daily.length === 0 ? (
                                                <p className="booking-muted">No appointments</p>
                                            ) : (
                                                daily.map(renderCalendarAppointment)
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {view === "day" && (
                            <div className="booking-day-view">
                                <h2>{formatDate(day)}</h2>
                                {dailyAppointments.length === 0 ? (
                                    <p>No appointments for this day.</p>
                                ) : (
                                    dailyAppointments.map(renderCalendarAppointment)
                                )}
                            </div>
                        )}
                    </section>

                    <aside className="booking-panel booking-side-panel">
                        <div className="booking-day-appointments">
                            <h2>Appointments on {formatDate(day)}</h2>
                            <p className="booking-muted">
                                {dailyAppointments.length} active appointment
                                {dailyAppointments.length === 1 ? "" : "s"}
                            </p>

                            {appointmentsError && (
                                <p className="booking-status error" role="alert">
                                    {appointmentsError}
                                </p>
                            )}

                            {dailyAppointments.length === 0 && !appointmentsError ? (
                                <p>No appointments for this day.</p>
                            ) : (
                                <div className="booking-day-appointment-list">
                                    {dailyAppointments.map((appointment) => (
                                        <button
                                            key={appointment.id}
                                            type="button"
                                            className="booking-day-appointment-button"
                                            aria-expanded={
                                                String(openedAppointmentId) === String(appointment.id)
                                            }
                                            onClick={() =>
                                                setOpenedAppointmentId((current) =>
                                                    String(current) === String(appointment.id)
                                                        ? null
                                                        : appointment.id
                                                )
                                            }
                                        >
                                            <strong>{appointment.appointment_time}</strong>
                                            <span>
                                                {appointment.first_name} {appointment.last_name}
                                            </span>
                                            <small>{appointment.service}</small>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {openedAppointment && (
                                <div className="booking-appointment booking-opened-details">
                                    <h3>
                                        {openedAppointment.first_name}{" "}
                                        {openedAppointment.last_name}
                                    </h3>
                                    <p>
                                        {formatDate(openedAppointment.appointment_date)} at{" "}
                                        {openedAppointment.appointment_time}
                                    </p>
                                    <p>
                                        {openedAppointment.service} ·{" "}
                                        {openedAppointment.tax_preparer} ·{" "}
                                        {openedAppointment.duration_minutes ?? 30} minutes
                                    </p>
                                    <p>
                                        Visit: {visitLabel(openedAppointment.visit_format)}
                                    </p>
                                    <p>
                                        Phone: {openedAppointment.phone || "Not provided"}
                                    </p>
                                    <p>
                                        Email: {openedAppointment.email || "Not provided"}
                                    </p>

                                    {renderAppointmentActions(openedAppointment)}

                                    <button
                                        type="button"
                                        className="booking-close-details"
                                        onClick={() => setOpenedAppointmentId(null)}
                                    >
                                        Close details
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="booking-form-section">
                            <h2>Book for {formatDate(day)}</h2>

                            {day < dateKey(new Date()) ? (
                                <p>
                                    Past appointments can be viewed, but new appointments
                                    must be booked for today or later.
                                </p>
                            ) : (
                                <>
                                    <div className="booking-filters">
                                        <label className="booking-filter">
                                            Service
                                            <select
                                                value={service}
                                                onChange={(event) =>
                                                    setService(event.target.value)
                                                }
                                            >
                                                <option value="">Select a service</option>
                                                {SERVICES.map((item) => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="booking-filter">
                                            Appointment length
                                            <select
                                                value={duration}
                                                onChange={(event) =>
                                                    setDuration(Number(event.target.value))
                                                }
                                            >
                                                <option value={10}>10 minutes</option>
                                                <option value={15}>15 minutes</option>
                                                <option value={30}>30 minutes</option>
                                                <option value={60}>1 hour</option>
                                            </select>
                                        </label>

                                        <label className="booking-filter">
                                            Preparer
                                            <select
                                                value={preparer}
                                                onChange={(event) =>
                                                    setPreparer(event.target.value)
                                                }
                                            >
                                                <option value="">Choose a preparer</option>
                                                {PREPARERS.map((name) => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="booking-filter">
                                            How would you like to meet?
                                            <select
                                                value={visitFormat}
                                                onChange={(event) =>
                                                    setVisitFormat(event.target.value)
                                                }
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
                                        <p className="booking-status error" role="alert">
                                            {bookingError}
                                        </p>
                                    )}

                                    {!loadingSlots &&
                                        !bookingError &&
                                        service &&
                                        preparer &&
                                        slots.length === 0 && (
                                            <p>No available times for this date.</p>
                                        )}

                                    <label className="booking-filter">
                                        Select a time
                                        <select
                                            value={time}
                                            onChange={(event) =>
                                                setTime(event.target.value)
                                            }
                                            disabled={loadingSlots || slots.length === 0}
                                        >
                                            <option value="">Choose an available time</option>
                                            {slots.map((slot) => (
                                                <option key={slot} value={slot}>
                                                    {slot}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {time && (
                                        <>
                                            <p className="booking-selection-summary">
                                                {formatDate(day)} at {time} with {preparer} for{" "}
                                                {duration} minutes
                                            </p>

                                            <form
                                                className="booking-customer-form"
                                                onSubmit={handleBooking}
                                            >
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
                                                    {submitting
                                                        ? "Booking..."
                                                        : "Book Appointment"}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </>
                            )}

                            {bookingSuccess && (
                                <p className="booking-status" role="status">
                                    {bookingSuccess}
                                </p>
                            )}
                        </div>
                    </aside>
                </div>

                <section className="booking-panel">
                    <div className="booking-list-heading">
                        <h2>
                            {showAll
                                ? "All Appointments"
                                : `Appointments on ${formatDate(day)}`}
                        </h2>

                        <button
                            type="button"
                            onClick={() => setShowAll((current) => !current)}
                        >
                            {showAll ? "Selected Day" : "All Appointments"}
                        </button>
                    </div>

                    {editSuccess && (
                        <p className="booking-status" role="status">
                            {editSuccess}
                        </p>
                    )}
                    {cancelMessage && (
                        <p className="booking-status" role="status">
                            {cancelMessage}
                        </p>
                    )}
                    {cancelError && (
                        <p className="booking-status error" role="alert">
                            {cancelError}
                        </p>
                    )}
                    {contactMessage && (
                        <p className="booking-status" role="status">
                            {contactMessage}
                        </p>
                    )}
                    {contactError && (
                        <p className="booking-status error" role="alert">
                            {contactError}
                        </p>
                    )}

                    {visibleAppointments.length === 0 && !appointmentsError && (
                        <p>No active appointments shown.</p>
                    )}

                    <div className="booking-actions">
                        <button
                            type="button"
                            disabled={selectedAppointmentIds.length === 0}
                            onClick={() =>
                                openCampaignDraft(selectedAppointmentIds)
                            }
                        >
                            Create Group Campaign ({selectedAppointmentIds.length})
                        </button>
                    </div>

                    {visibleAppointments.map((appointment) => (
                        <article
                            className="booking-appointment booking-list-item"
                            key={appointment.id}
                        >
                            <div>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedAppointmentIds.includes(
                                            appointment.id
                                        )}
                                        onChange={(event) =>
                                            setSelectedAppointmentIds((current) =>
                                                event.target.checked
                                                    ? [...current, appointment.id]
                                                    : current.filter(
                                                        (id) => id !== appointment.id
                                                    )
                                            )
                                        }
                                        aria-label={`Select appointment for ${appointment.first_name} ${appointment.last_name}`}
                                    />
                                </label>

                                <button
                                    type="button"
                                    className="booking-list-open"
                                    onClick={() => openAppointment(appointment)}
                                >
                                    <strong>
                                        {formatDate(appointment.appointment_date)} at{" "}
                                        {appointment.appointment_time}
                                    </strong>
                                    {" · "}
                                    {appointment.first_name} {appointment.last_name}
                                </button>

                                <p>
                                    {appointment.service} ·{" "}
                                    {appointment.tax_preparer} ·{" "}
                                    {appointment.duration_minutes ?? 30} minutes
                                </p>
                                <p>
                                    Visit: {visitLabel(appointment.visit_format)}
                                </p>
                            </div>

                            {renderAppointmentActions(appointment)}
                        </article>
                    ))}

                    {editing && (
                        <form
                            className="booking-edit-form"
                            ref={editFormRef}
                            onSubmit={saveEdit}
                        >
                            <h3>
                                Edit {editing.first_name} {editing.last_name}
                            </h3>

                            <label className="booking-field">
                                Service
                                <select
                                    value={editing.service}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            service: event.target.value,
                                        })
                                    }
                                >
                                    {SERVICES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="booking-field">
                                Preparer
                                <select
                                    value={editing.tax_preparer}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            tax_preparer: event.target.value,
                                        })
                                    }
                                >
                                    {PREPARERS.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
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
                                        editing.appointment_date &&
                                            editing.appointment_time
                                            ? `${editing.appointment_date}T${timeToInput(
                                                editing.appointment_time
                                            )}`
                                            : ""
                                    }
                                    onChange={(event) => {
                                        if (!event.target.value) return;

                                        const [newDate, newTime] =
                                            event.target.value.split("T");

                                        setEditing({
                                            ...editing,
                                            appointment_date: newDate,
                                            appointment_time: inputToTime(newTime),
                                        });
                                    }}
                                />
                            </label>
                            <label className="booking-field">
                                Visit format
                                <select
                                    value={editing.visit_format || ""}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            visit_format: event.target.value,
                                        })
                                    }
                                >
                                    <option value="">Not specified</option>
                                    <option value="in_person">In person</option>
                                    <option value="phone">Over the phone</option>
                                    <option value="virtual">Virtual/online</option>
                                </select>
                            </label>

                            <label className="booking-field">
                                Appointment details
                                <textarea
                                    value={editing.message || ""}
                                    onChange={(event) =>
                                        setEditing({ ...editing, message: event.target.value })
                                    }
                                    rows={3}
                                />
                            </label>


                            <label className="booking-field">
                                Appointment length
                                <select
                                    value={editing.duration_minutes ?? 30}
                                    onChange={(event) =>
                                        setEditing({
                                            ...editing,
                                            duration_minutes: Number(
                                                event.target.value
                                            ),
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
                                <p className="booking-status error" role="alert">
                                    {editError}
                                </p>
                            )}

                            <div className="booking-actions">
                                <button
                                    className="booking-submit"
                                    type="submit"
                                    disabled={savingEdit}
                                >
                                    {savingEdit ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    disabled={savingEdit}
                                    onClick={() => setEditing(null)}
                                >
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
