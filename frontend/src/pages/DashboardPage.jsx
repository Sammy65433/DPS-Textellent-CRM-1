import { Row, Col, Alert, Card, ListGroup, Badge, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import StatsCards from "../components/StatsCards";
import {
    FaUsers,
    FaEnvelope,
    FaBullhorn,
    FaFileAlt,
} from "react-icons/fa";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { createContact, createCampaign } from "../api/api";
import { FaCalendarCheck } from "react-icons/fa";


const PREPARER_COLORS = {
    "Pierre Polidor": { bg: "#eff6ff", text: "#1e40af", dot: "#2563eb" },
    "Dalia Pierre": { bg: "#f5f0ff", text: "#6b21a8", dot: "#9333ea" },
    "Severe Jacquet": { bg: "#ecfdf5", text: "#065f46", dot: "#059669" },
    "Jean P Cifrant": { bg: "#fff7ed", text: "#9a3412", dot: "#ea580c" },
    "Ricot Casimir": { bg: "#fdf2f8", text: "#9d174d", dot: "#db2777" },
};

function DashboardPage({
    theme,
    onToggleTheme,
    alert,
    contacts,
    messages,
    templates,
    campaigns,
    emails = [],
}) {
    const recentMessages = [...messages]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const recentCampaigns = [...campaigns]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const recentEmails = [...emails]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const contactsMissingEmail = contacts.filter(contact => !contact.email).length;
    const draftCampaigns = campaigns.filter(campaign => campaign.status === "draft").length;
const [appointments, setAppointments] = useState([]);
    const [bookingError, setBookingError] = useState("");
    const navigate = useNavigate();
    const [actionStatus, setActionStatus] = useState({});

    const activityByDay = {};

[...messages, ...emails].forEach((item) => {
  if (!item.createdAt) return;
  const day = new Date(item.createdAt).toLocaleDateString("en-CA");
  activityByDay[day] ??= { day, outreach: 0, bookings: 0 };
  activityByDay[day].outreach += 1;
});

appointments
  .filter((item) => ["booked", "confirmed"].includes(item.status))
  .forEach((item) => {
    const day = item.appointment_date;
    activityByDay[day] ??= { day, outreach: 0, bookings: 0 };
    activityByDay[day].bookings += 1;
  });

const activityRows = Object.values(activityByDay).sort((a, b) =>
  a.day.localeCompare(b.day)
);


    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${import.meta.env.VITE_API_URL}/api/staff/appointments`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error("Could not load appointments.");
                return response.json();
            })
            .then((data) => setAppointments(Array.isArray(data) ? data : []))
            .catch((error) => setBookingError(error.message));
    }, []);

    const today = new Date();
    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const todaysAppointments = appointments.filter(
        (appointment) =>
            appointment.appointment_date === todayKey &&
            ["booked", "confirmed"].includes(appointment.status)
    );

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekKeys = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0"),
        ].join("-");
    });

    const weekAppointments = appointments
        .filter(
            (a) =>
                weekKeys.includes(a.appointment_date) &&
                ["booked", "confirmed"].includes(a.status)
        )
        .sort((a, b) => {
            const dayDiff = weekKeys.indexOf(a.appointment_date) - weekKeys.indexOf(b.appointment_date);
            if (dayDiff !== 0) return dayDiff;
            return String(a.appointment_time).localeCompare(String(b.appointment_time));
        });



    async function saveContactFromBooking(appt) {
        setActionStatus((prev) => ({ ...prev, [appt.id]: "Saving contact..." }));
        try {
            const result = await createContact({
                firstName: appt.first_name,
                lastName: appt.last_name,
                phone: String(appt.phone || "").replace(/\D/g, ""),
                email: appt.email || "",
                tags: "DPS Website",
                notes: appt.message || "",
            });
            if (result?.error) throw new Error(result.error);
            setActionStatus((prev) => ({ ...prev, [appt.id]: "Contact saved." }));
        } catch (err) {
            setActionStatus((prev) => ({ ...prev, [appt.id]: err.message || "Could not save contact." }));
        }
    }

    async function createCampaignFromBooking(appt) {
        setActionStatus((prev) => ({ ...prev, [appt.id]: "Creating campaign..." }));
        try {
            const contactResult = await createContact({
                firstName: appt.first_name,
                lastName: appt.last_name,
                phone: String(appt.phone || "").replace(/\D/g, ""),
                email: appt.email || "",
                tags: "DPS Website",
                notes: appt.message || "",
            });
            if (contactResult?.error) throw new Error(contactResult.error);
            const contactId = contactResult?._id || contactResult?.id;
            if (!contactId) throw new Error("Contact was not created.");
            const campResult = await createCampaign({
                name: `DPS website - ${appt.first_name} ${appt.last_name}`,
                body: appt.message || "Follow up on your DPS appointment request.",
                subject: "DPS follow-up",
                type: "sms",
                contactIds: [contactId],
            });
            if (campResult?.error) throw new Error(campResult.error);
            setActionStatus((prev) => ({ ...prev, [appt.id]: "Campaign created." }));
        } catch (err) {
            setActionStatus((prev) => ({ ...prev, [appt.id]: err.message || "Could not create campaign." }));
        }
    }

    function bookFromBooking(appt) {
        navigate("/booking", {
            state: {
                customer: {
                    first_name: appt.first_name,
                    last_name: appt.last_name,
                    phone: appt.phone,
                    email: appt.email,
                },
            },
        });
    }

    async function deleteBookingMessage(appt) {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        setActionStatus((prev) => ({ ...prev, [appt.id]: "Deleting..." }));
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/staff/booking-messages/${encodeURIComponent(appt.id)}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Could not delete the message.");
            }
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === appt.id ? { ...a, message: "" } : a
                )
            );
            setActionStatus((prev) => ({ ...prev, [appt.id]: "Message deleted." }));
        } catch (err) {
            setActionStatus((prev) => ({ ...prev, [appt.id]: err.message || "Could not delete." }));
        }
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Dashboard"
                subtitle="Overview of contacts, templates, messages, campaigns, and emails."
            />
            <Card className="crm-card border-0 mb-4">
                <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h3 className="mb-1">
                            <FaCalendarCheck className="me-2" />
                            Today’s Appointments
                        </h3>
                        <p className="mb-0">
                            {bookingError || `${todaysAppointments.length} scheduled today`}
                        </p>
                    </div>
                    <Button as={Link} to="/booking" variant="success">
                        View Calendar
                    </Button>
                </Card.Body>
            </Card>

            <Card className="crm-card border-0 mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h3 className="mb-0">
                            <FaCalendarCheck className="me-2" />
                            This Week&apos;s Bookings
                        </h3>
                        <Button as={Link} to="/booking" size="sm" variant="outline-primary">
                            Open Calendar
                        </Button>
                    </div>
                    {weekAppointments.length === 0 ? (
                        <p className="mb-0 text-muted">No bookings scheduled this week.</p>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {weekAppointments.map((a) => {
                                const color =
                                    PREPARER_COLORS[a.tax_preparer] || {
                                        bg: "#f1f5f9",
                                        text: "#334155",
                                        dot: "#94a3b8",
                                    };
                                return (
                                    <div
                                        key={a.id}
                                        className="d-flex align-items-center gap-3 p-2 rounded"
                                        style={{
                                            background: color.bg,
                                            borderLeft: `4px solid ${color.dot}`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: color.dot,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold" style={{ color: color.text }}>
                                                {a.first_name} {a.last_name}{" "}
                                                <span className="text-muted fw-normal">
                                                    · {a.appointment_date} {a.appointment_time}
                                                </span>
                                            </div>
                                            <small className="text-muted">
                                                {a.service} · {a.tax_preparer} · {a.duration_minutes ?? 30} min
                                                {a.message ? ` · 💬 ${a.message}` : ""}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <StatsCards
                contacts={contacts}
                messages={messages}
                templates={templates}
                campaigns={campaigns}
                emails={emails}
            />

            <Row className="g-4 section-spacer">
                <Col lg={8}>
                    <Card className="crm-card analytics-mini-panel border-0">
                        <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                            <span>Communications &amp; Scheduled Appointments</span>
                            <Button as={Link} to="/analytics" size="sm" variant="outline-primary">
                                View Full Analytics
                            </Button>
                        </Card.Header>

                        <Card.Body style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityRows}>
                                    <defs>
                                        <linearGradient id="dashboardActivityFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Area
  type="monotone"
  dataKey="outreach"
  name="SMS & Email"
  stroke="#2563eb"
  fill="#bfdbfe"
  strokeWidth={3}
/>
<Area
  type="monotone"
  dataKey="bookings"
  name="Scheduled Appointments"
  stroke="#0f766e"
  fill="#99f6e4"
  strokeWidth={3}
/>

                                </AreaChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Row className="g-4">
                        <Col md={12}>
                            <Card className="crm-card panel-actions border-0">
                                <Card.Header className="card-header-clean">
                                    Quick Actions
                                </Card.Header>
                                <Card.Body className="d-grid gap-3">
                                    <Button as={Link} to="/contacts" variant="dark">
                                        <FaUsers className="me-2" />
                                        Manage Contacts
                                    </Button>
                                    <Button as={Link} to="/emails" variant="primary">
                                        <FaEnvelope className="me-2" />
                                        Send Email
                                    </Button>
                                    <Button as={Link} to="/templates" variant="warning">
                                        <FaFileAlt className="me-2" />
                                        Manage Templates
                                    </Button>
                                    <Button as={Link} to="/campaigns" variant="success">
                                        <FaBullhorn className="me-2" />
                                        Create Campaign
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={12}>
                            <Card className="crm-card panel-tasks border-0">
                                <Card.Header className="card-header-clean">
                                    Tasks & Follow-Ups
                                </Card.Header>
                                <ListGroup variant="flush">
                                    <ListGroup.Item>
                                        Draft campaigns pending review: <strong>{draftCampaigns}</strong>
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        Contacts missing email: <strong>{contactsMissingEmail}</strong>
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        Review recent outreach and follow up with inactive leads.
                                    </ListGroup.Item>
                                </ListGroup>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>

            <Row className="g-4 section-spacer">
                <Col md={6}>
                    <Card className="crm-card panel-messages border-0">
                        <Card.Header className="card-header-clean">
                            Recent Messages
                        </Card.Header>
                        <ListGroup variant="flush">
                            {recentMessages.length === 0 ? (
                                <ListGroup.Item>No recent messages yet.</ListGroup.Item>
                            ) : (
                                recentMessages.map(msg => (
                                    <ListGroup.Item key={msg._id}>
                                        <div className="fw-semibold">
                                            {msg.contactId?.firstName
                                                ? `${msg.contactId.firstName} ${msg.contactId.lastName || ""}`
                                                : msg.toPhone || msg.fromPhone}
                                        </div>
                                        <div>{msg.body}</div>
                                        <small className="text-muted">
                                            {msg.direction} • {new Date(msg.createdAt).toLocaleString()}
                                        </small>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="crm-card panel-emails border-0">
                        <Card.Header className="card-header-clean">
                            Recent Emails
                        </Card.Header>
                        <ListGroup variant="flush">
                            {recentEmails.length === 0 ? (
                                <ListGroup.Item>No recent emails yet.</ListGroup.Item>
                            ) : (
                                recentEmails.map(email => (
                                    <ListGroup.Item key={email._id}>
                                        <div className="fw-semibold">{email.toEmail}</div>
                                        <div>{email.subject}</div>
                                        <small className="text-muted">
                                            email • {new Date(email.createdAt).toLocaleString()}
                                        </small>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 section-spacer">
                <Col md={12}>
                    <Card className="crm-card panel-booking-notes border-0">
                        <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                            <span>Front-Page Booking Messages</span>
                            <Button as={Link} to="/booking" size="sm" variant="outline-primary">
                                Open Calendar
                            </Button>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {appointments.filter((a) => a.message).length === 0 ? (
                                <ListGroup.Item>
                                    No messages from website bookings yet.
                                </ListGroup.Item>
                            ) : (
                                appointments
                                    .filter((a) => a.message)
                                    .sort(
                                        (a, b) =>
                                            new Date(b.created_at || b.appointment_date) -
                                            new Date(a.created_at || a.appointment_date)
                                    )
                                    .slice(0, 10)
                                    .map((a) => (
                                        <ListGroup.Item key={a.id}>
                                            <div className="fw-semibold">
                                                {a.first_name} {a.last_name}
                                                {a.tax_preparer ? (
                                                    <Badge bg="secondary" className="ms-2">
                                                        {a.tax_preparer}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <div>{a.message}</div>
                                            <div className="d-flex flex-wrap gap-2 mt-2">
                                                <Button size="sm" variant="outline-primary" onClick={() => saveContactFromBooking(a)}>
                                                    Save to Contacts
                                                </Button>
                                                <Button size="sm" variant="outline-success" onClick={() => createCampaignFromBooking(a)}>
                                                    Create Campaign
                                                </Button>
                                                <Button size="sm" variant="outline-dark" onClick={() => bookFromBooking(a)}>
                                                    Book Appointment
                                                </Button>
                                                <Button size="sm" variant="outline-danger" onClick={() => deleteBookingMessage(a)}>
                                                    Delete
                                                </Button>
                                            </div>
                                            {actionStatus[a.id] && (
                                                <small className="text-muted d-block mt-1">{actionStatus[a.id]}</small>
                                            )}
                                            <small className="text-muted">
                                                {a.appointment_date} · {a.appointment_time} · {a.service}
                                            </small>
                                        </ListGroup.Item>
                                    ))
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>

        </AppLayout>
    );
}

export default DashboardPage;
