import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, ListGroup, Nav, Row, Tab, Tabs } from "react-bootstrap";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { getRevenueInsights } from "../api/api";

function AnalyticsPage({
    theme,
    onToggleTheme,
    alert,
    contacts = [],
    messages = [],
    emails = [],
    templates = [],
    campaigns = [],
}) {
    const [appointments, setAppointments] = useState([]);
    const [bookingError, setBookingError] = useState("");
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [range, setRange] = useState("30");
    const [revenueInsights, setRevenueInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL;

        if (!token || !apiUrl) {
            setBookingError("CRM login or API URL is missing.");
            setLoadingBookings(false);
            return;
        }

        const controller = new AbortController();

        async function loadAppointments() {
            try {
                const response = await fetch(
                    `${apiUrl}/api/staff/appointments`,
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
                    setBookingError("");
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    setBookingError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) setLoadingBookings(false);
            }
        }

        loadAppointments();
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        setLoadingInsights(true);
        getRevenueInsights({ contacts, messages, emails, appointments: [] })
            .then((data) => setRevenueInsights(Array.isArray(data?.insights) ? data.insights : []))
            .catch(() => setRevenueInsights([]))
            .finally(() => setLoadingInsights(false));
    }, []);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - Number(range) + 1);

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const withinRange = (value) => {
        if (!value) return false;
        const date = new Date(value);
        return (
            !Number.isNaN(date.getTime()) &&
            date >= startDate &&
            date <= endDate
        );
    };

    const contactsAdded = contacts.filter((item) =>
        withinRange(item.createdAt)
    ).length;

    // sentAt is preferred. updatedAt only approximates the send date.
    const campaignsSent = campaigns.filter(
        (item) =>
            item.status === "sent" &&
            withinRange(item.sentAt || item.updatedAt)
    ).length;

    const inRange = appointments.filter((appointment) => {
        const date = new Date(`${appointment.appointment_date}T00:00:00`);
        return (
            !Number.isNaN(date.getTime()) &&
            date >= startDate &&
            date <= endDate
        );
    });

    const booked = inRange.filter(
        (item) => item.status === "booked"
    ).length;
    const confirmed = inRange.filter(
        (item) => item.status === "confirmed"
    ).length;
    const cancelled = inRange.filter(
        (item) => item.status === "cancelled"
    ).length;

    const byDay = {};
    const byService = {};
    const byPreparer = {};

    inRange.forEach((item) => {
        if (!["booked", "confirmed"].includes(item.status)) return;

        byDay[item.appointment_date] =
            (byDay[item.appointment_date] || 0) + 1;

        const service = item.service || "Other";
        byService[service] = (byService[service] || 0) + 1;

        const preparer = item.tax_preparer || "Unassigned";
        byPreparer[preparer] = (byPreparer[preparer] || 0) + 1;
    });

    const bookingTrend = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, count]) => ({ day, count }));

    const serviceRows = Object.entries(byService)
        .sort((a, b) => b[1] - a[1])
        .map(([service, count]) => ({ service, count }));

    const preparerRows = Object.entries(byPreparer)
        .sort((a, b) => b[1] - a[1])
        .map(([preparer, count]) => ({ preparer, count }));

    const campaignRows = [
        {
            name: "Sent",
            value: campaigns.filter((item) => item.status === "sent").length,
        },
        {
            name: "Scheduled",
            value: campaigns.filter(
                (item) => item.status === "scheduled"
            ).length,
        },
        {
            name: "Draft",
            value: campaigns.filter((item) => item.status === "draft").length,
        },
    ];

    const activityByDay = {};

    [...messages, ...emails].forEach((item) => {
        if (!item.createdAt) return;

        const date = new Date(item.createdAt);
        if (Number.isNaN(date.getTime())) return;

        const day = date.toLocaleDateString("en-US");
        activityByDay[day] = (activityByDay[day] || 0) + 1;
    });

    const activityRows = Object.entries(activityByDay)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([day, count]) => ({ day, count }));

    const metrics = [
        ["Booked", booked, "teal"],
        ["Confirmed", confirmed, "blue"],
        ["Cancelled", cancelled, "rose"],
        ["Contacts Added", contactsAdded, "violet"],
        ["Campaigns Sent", campaignsSent, "amber"],
        ["SMS", messages.length, "cyan"],
        ["Emails", emails.length, "indigo"],
        ["Templates", templates.length, "green"],
    ];

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Analytics"
                subtitle="Appointment trends, contact growth, and outreach activity."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}
            {bookingError && (
                <Alert variant="danger">{bookingError}</Alert>
            )}

            <div className="d-flex align-items-center gap-2 mb-3">
                <label htmlFor="analytics-range" className="fw-semibold">
                    Appointment date range
                </label>
                <select
                    id="analytics-range"
                    data-tour="analytics-range"
                    className="form-select"
                    style={{ maxWidth: 180 }}
                    value={range}
                    onChange={(event) => setRange(event.target.value)}
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                </select>
            </div>

            <Tabs defaultActiveKey="dashboard" className="mb-3" id="analytics-tabs">
                <Tab eventKey="dashboard" title="Dashboard">
            <Row className="g-4 mb-4" data-tour="analytics-kpis">
                {metrics.map(([label, value, color]) => (
                    <Col md={6} xl={3} key={label}>
                        <Card className={`analytics-kpi analytics-kpi-${color} h-100`}>
                            <Card.Body>
                                <span className="analytics-kpi-label">{label}</span>
                                <strong className="analytics-kpi-value">
                                    {loadingBookings &&
                                        ["Booked", "Confirmed", "Cancelled"].includes(label)
                                        ? "…"
                                        : value}
                                </strong>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4 mb-4">
                <Col xl={7}>
                    <Card className="crm-card analytics-panel analytics-trend-panel border-0" data-tour="analytics-trend">
                        <Card.Header className="card-header-clean">
                            Active Appointments by Date
                        </Card.Header>
                        <Card.Body style={{ height: 330 }}>
                            {bookingTrend.length === 0 ? (
                                <p>No appointments in this date range.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={bookingTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#0f766e"
                                            fill="#99f6e4"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={5}>
                    <Card className="crm-card analytics-panel analytics-status-panel border-0" data-tour="analytics-services">
                        <Card.Header className="card-header-clean">
                            Bookings by Service
                        </Card.Header>
                        <Card.Body style={{ height: 330 }}>
                            {serviceRows.length === 0 ? (
                                <p>No service data in this date range.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={serviceRows}
                                        layout="vertical"
                                        margin={{ left: 20, right: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="service"
                                            width={140}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#16a34a"
                                            radius={[0, 7, 7, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mb-4">
                <Col xl={6}>
                    <Card className="crm-card analytics-panel analytics-email-panel border-0" data-tour="analytics-preparers">
                        <Card.Header className="card-header-clean">
                            Bookings by Preparer
                        </Card.Header>
                        <Card.Body style={{ height: 320 }}>
                            {preparerRows.length === 0 ? (
                                <p>No preparer data in this date range.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={preparerRows}
                                        layout="vertical"
                                        margin={{ left: 15, right: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="preparer"
                                            width={110}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#06b6d4"
                                            radius={[0, 7, 7, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card className="crm-card analytics-panel analytics-tags-panel border-0" data-tour="analytics-activity">
                        <Card.Header className="card-header-clean">
                            Campaign Status, All Time
                        </Card.Header>
                        <Card.Body style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={campaignRows} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={95}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="value"
                                        fill="#f59e0b"
                                        radius={[0, 7, 7, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="crm-card analytics-panel analytics-trend-panel border-0">
                <Card.Header className="card-header-clean">
                    SMS and Email Activity, All Time
                </Card.Header>
                <Card.Body style={{ height: 300 }}>
                    {activityRows.length === 0 ? (
                        <p>No outreach activity yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityRows}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#2563eb"
                                    fill="#bfdbfe"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Card.Body>
            </Card>

            <Card className="crm-card border-0 mb-4 mt-4" data-tour="analytics-insights">
                <Card.Header className="card-header-clean d-flex justify-content-between align-items-center">
                    <span>📊 AI Revenue Insights</span>
                    <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={loadingInsights}
                        onClick={() => {
                            setLoadingInsights(true);
                            getRevenueInsights({ appointments, contacts, campaigns, emails })
                                .then((data) => setRevenueInsights(Array.isArray(data?.insights) ? data.insights : []))
                                .catch(() => setRevenueInsights([]))
                                .finally(() => setLoadingInsights(false));
                        }}
                    >
                        {loadingInsights ? "Analyzing..." : "Refresh"}
                    </Button>
                </Card.Header>
                <Card.Body>
                    {loadingInsights ? (
                        <p className="text-muted mb-0">Analyzing data...</p>
                    ) : revenueInsights.length === 0 ? (
                        <p className="text-muted mb-0">No insights available yet.</p>
                    ) : (
                        <ListGroup variant="flush">
                            {revenueInsights.map((insight, idx) => (
                                <ListGroup.Item key={idx}>
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold">{insight.title}</div>
                                            <div className="small">{insight.insight}</div>
                                            <div className="small text-muted mt-1">
                                                💡 {insight.recommendation}
                                            </div>
                                        </div>
                                        <Badge bg={insight.priority === "high" ? "danger" : insight.priority === "medium" ? "warning" : "secondary"}>
                                            {insight.priority}
                                        </Badge>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Card.Body>
            </Card>

                </Tab>

                <Tab eventKey="messages" title="Messages">
                    <Card className="crm-card border-0 mb-3">
                        <Card.Header className="card-header-clean">Message Volume</Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-2">Total messages: {messages.length} · Emails: {emails.length}</p>
                            <p className="text-muted small">Use the Contacts page to view individual conversations.</p>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="blasts" title="Text Blast">
                    <Card className="crm-card border-0 mb-3">
                        <Card.Header className="card-header-clean">Campaigns</Card.Header>
                        <Card.Body>
                            {campaigns.length === 0 ? (
                                <p className="text-muted small">No campaigns yet.</p>
                            ) : (
                                campaigns.map((c) => (
                                    <div key={c._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                                        <span className="small">{c.name}</span>
                                        <Badge bg={c.status === "sent" ? "success" : c.status === "scheduled" ? "warning" : "secondary"}>{c.status}</Badge>
                                    </div>
                                ))
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="automations" title="Automations">
                    <Card className="crm-card border-0 mb-3">
                        <Card.Header className="card-header-clean">Drip Campaigns</Card.Header>
                        <Card.Body>
                            <p className="text-muted small">Manage drip campaigns from the Drip Campaigns page.</p>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="autoresponders" title="Auto Responders">
                    <Card className="crm-card border-0 mb-3">
                        <Card.Header className="card-header-clean">Auto Responders</Card.Header>
                        <Card.Body>
                            <p className="text-muted small">Configure out-of-office and after-hours responders from the Automations page.</p>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </AppLayout>
    );
}

export default AnalyticsPage;
