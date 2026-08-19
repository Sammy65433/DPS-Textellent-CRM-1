import { Row, Col, Card, Alert } from "react-bootstrap";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import {
    FaEnvelope,
    FaComments,
    FaUsers,
    FaBullhorn,
    FaFileAlt,
    FaTags,
} from "react-icons/fa";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area,
} from "recharts";

function AnalyticsPage({
    theme,
    onToggleTheme,
    alert,
    contacts,
    messages,
    emails,
    templates,
    campaigns,
}) {
    const sentCampaigns = campaigns.filter(c => c.status === "sent").length;
    const scheduledCampaigns = campaigns.filter(c => c.status === "scheduled").length;
    const draftCampaigns = campaigns.filter(c => c.status === "draft").length;

    const contactsWithEmail = contacts.filter(c => c.email).length;
    const contactsWithoutEmail = contacts.filter(c => !c.email).length;

    const tagCounts = {};
    contacts.forEach(contact => {
        (contact.tags || "")
            .split(",")
            .map(tag => tag.trim())
            .filter(Boolean)
            .forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
    });

    const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag, count]) => ({ tag, count }));

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

    const campaignStatusData = [
        { name: "Sent", value: sentCampaigns },
        { name: "Scheduled", value: scheduledCampaigns },
        { name: "Draft", value: draftCampaigns },
    ];

    const emailCoverageData = [
        { name: "With Email", value: contactsWithEmail },
        { name: "Without Email", value: contactsWithoutEmail },
    ];

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader
                title="Analytics"
                subtitle="Track communication activity, campaign performance, and contact insights."
            />

            {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={4} xl={2}>
                    <Card className="dashboard-card stat-card-contacts border-0">
                        <Card.Body>
                            <div className="dashboard-icon stat-icon-contacts">
                                <FaUsers />
                            </div>
                            <div className="dashboard-stat-label">Contacts</div>
                            <h3 className="dashboard-stat-value">{contacts.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} xl={2}>
                    <Card className="dashboard-card stat-card-messages border-0">
                        <Card.Body>
                            <div className="dashboard-icon stat-icon-messages">
                                <FaComments />
                            </div>
                            <div className="dashboard-stat-label">SMS</div>
                            <h3 className="dashboard-stat-value">{messages.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} xl={2}>
                    <Card className="dashboard-card stat-card-emails border-0">
                        <Card.Body>
                            <div className="dashboard-icon stat-icon-emails">
                                <FaEnvelope />
                            </div>
                            <div className="dashboard-stat-label">Emails</div>
                            <h3 className="dashboard-stat-value">{emails.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} xl={2}>
                    <Card className="dashboard-card stat-card-templates border-0">
                        <Card.Body>
                            <div className="dashboard-icon stat-icon-templates">
                                <FaFileAlt />
                            </div>
                            <div className="dashboard-stat-label">Templates</div>
                            <h3 className="dashboard-stat-value">{templates.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} xl={2}>
                    <Card className="dashboard-card stat-card-campaigns border-0">
                        <Card.Body>
                            <div className="dashboard-icon stat-icon-campaigns">
                                <FaBullhorn />
                            </div>
                            <div className="dashboard-stat-label">Campaigns</div>
                            <h3 className="dashboard-stat-value">{campaigns.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} xl={2}>
                    <Card className="dashboard-card stat-card-templates border-0">
                        <Card.Body>
                            <div className="dashboard-icon stat-icon-templates">
                                <FaTags />
                            </div>
                            <div className="dashboard-stat-label">Top Tags</div>
                            <h3 className="dashboard-stat-value">{topTags.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col xl={8}>
                    <Card className="crm-card analytics-panel analytics-trend-panel border-0">
                        <Card.Header className="card-header-clean">
                            Activity Trend
                        </Card.Header>
                        <Card.Body style={{ height: "340px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityRows}>
                                    <defs>
                                        <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
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
                                        fill="url(#activityFill)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={4}>
                    <Card className="crm-card analytics-panel analytics-status-panel border-0">
                        <Card.Header className="card-header-clean">
                            Campaign Status
                        </Card.Header>
                        <Card.Body style={{ height: "340px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={campaignStatusData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 20, left: 50, bottom: 10 }}
                                >

                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#16a34a" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card className="crm-card analytics-panel analytics-email-panel border-0">
                        <Card.Header className="card-header-clean">
                            Email Coverage
                        </Card.Header>
                        <Card.Body style={{ height: "320px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
  data={emailCoverageData}
  layout="vertical"
  margin={{ top: 10, right: 20, left: 70, bottom: 10 }}
>

                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card className="crm-card analytics-panel analytics-tags-panel border-0">
                        <Card.Header className="card-header-clean">
                            Top Tags
                        </Card.Header>
                        <Card.Body style={{ height: "320px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
  data={topTags}
  layout="vertical"
  margin={{ top: 10, right: 20, left: 70, bottom: 10 }}
>

                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="tag" type="category" tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </AppLayout>
    );
}

export default AnalyticsPage;
