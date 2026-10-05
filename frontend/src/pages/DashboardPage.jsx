import { Row, Col, Alert, Card, ListGroup, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
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
import { FaCalendarCheck } from "react-icons/fa";


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

    const activityByDay = {};
    [...messages, ...emails].forEach(item => {
        const day = new Date(item.createdAt).toLocaleDateString();
        activityByDay[day] = (activityByDay[day] || 0) + 1;
    });

    const activityRows = Object.entries(activityByDay)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([day, count]) => ({
            day,
            count,
        }));

    const [appointments, setAppointments] = useState([]);
    const [bookingError, setBookingError] = useState("");

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
                            <span>Analytics Snapshot</span>
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
                                        dataKey="count"
                                        stroke="#2563eb"
                                        fill="url(#dashboardActivityFill)"
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

        </AppLayout>
    );
}

export default DashboardPage;
