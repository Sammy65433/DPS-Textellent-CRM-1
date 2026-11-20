import { useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import {
    FaColumns,
    FaUsers,
    FaFileAlt,
    FaBullhorn,
    FaEnvelope,
    FaImage,
    FaPaperPlane,
    FaChartBar,
    FaCalendarCheck,
    FaUserShield,
    FaRobot,
    FaQuestionCircle,
    FaSearch,
} from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";
import { sendAIChat } from "../api/api";

const SECTIONS = [
    { icon: FaColumns, title: "Dashboard", color: "#0f5c54", items: ["Overview of contacts, templates, campaigns, emails, and appointments.", "Today's appointments and this week's bookings at a glance.", "Quick Actions dropdown for one-click navigation.", "AI Follow-Up Suggestions and AI Revenue Insights.", "Front-page booking messages from the DPS website."] },
    { icon: FaUsers, title: "Contacts", color: "#6e42a8", items: ["Add, edit, delete contacts (or use the dedicated Add Contact page).", "Search by name, phone, email, tags, or notes.", "Filter by status (Active/Inactive/Recent), tags, and contact lists.", "Import contacts from CSV (phone column required).", "Custom fields (e.g., Date of Birth) on each contact.", "AI Search (natural language), AI Summary (save to notes), Suggest Tags.", "Send SMS/Email, book appointments, send account-link invitations.", "View conversation history, documents, and AI smart replies."] },
    { icon: FaFileAlt, title: "Templates", color: "#f59e0b", items: ["Create/edit/delete templates with placeholders ({{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{companyPhone}}, {{companyEmail}}, {{companyAddress}}, {{companyWebsite}}).", "AI Generate Template from a goal description.", "Company info (DPS) reference panel.", "Action buttons: Use for Campaign, Send as SMS, Send as Email, Booking Reminder, Edit, Delete."] },
    { icon: FaBullhorn, title: "Text Blasts (Campaigns)", color: "#dc2626", items: ["Create bulk SMS/email campaigns to selected contacts.", "Choose a template or type a message directly (overrides template).", "AI Generate Copy from a goal + audience + tone.", "Schedule campaigns; edit name/type/status/subject/body/template.", "Search and filter; Recurring Campaigns + View Templates links."] },
    { icon: FaEnvelope, title: "Emails", color: "#2563eb", items: ["View and send individual emails to contacts.", "Choose a template or type your own body.", "AI Generate Email (subject + body from a goal).", "AI Suggest Replies based on email history.", "AI Summary of the contact's email thread (save to notes).", "Delete individual emails or entire conversations."] },
    { icon: FaImage, title: "Media Library", color: "#0891b2", items: ["Upload images/PDFs (max 5MB).", "Grid view with image previews.", "Search by name/filename.", "Reference files by URL in emails and campaigns.", "Delete files you no longer need."] },
    { icon: FaPaperPlane, title: "Drip Campaigns", color: "#7c3aed", items: ["Multi-step timed email sequences.", "Each step: delay (days), subject, body. Placeholders supported.", "AI Generate per step + template selector.", "Load Sample Drip (3-step welcome series).", "Enroll contacts; scheduler runs every minute in the background."] },
    { icon: FaCalendarCheck, title: "Booking", color: "#16a34a", items: ["Full calendar (Day/Week/Month views).", "Create, edit, cancel appointments (tax + realty).", "AI Schedule: type a request, AI fills the form and can auto-book.", "Find existing contact + auto-fill client details.", "Block out time (lunch, meetings).", "15-min slots, dynamic office hours, notes with suggested chips."] },
    { icon: FaChartBar, title: "Analytics (Reports)", color: "#ea580c", items: ["Tabs: Dashboard, Messages, Text Blast, Automations, Auto Responders.", "KPIs: Booked, Confirmed, Cancelled, Contacts, Campaigns, SMS, Emails, Templates.", "Charts: appointments by date, by service, by preparer, SMS/email activity.", "Date range filter (7/30/90 days).", "AI Revenue Insights with priority + recommendations."] },
    { icon: FaRobot, title: "Automations", color: "#db2777", items: ["Out-of-Office Responder (date range + SMS/Email messages).", "After-Hours Responder (time window + SMS/Email messages).", "Birthday Greeting (daily at 9 AM ET, SMS/Email).", "Channels: SMS only, Email only, or SMS + Email."] },
    { icon: FaUserShield, title: "Staff Management (Admin)", color: "#0f5c54", items: ["Invite staff (email + one-time setup link, 24h expiry).", "Deactivate/reactivate accounts. Cannot deactivate yourself.", "Role-based: admin vs. staff."] },
];

function HelpPage({ theme, onToggleTheme }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    async function ask() {
        if (!query.trim()) return;
        setLoading(true);
        setAnswer("");
        try {
            const data = await sendAIChat({
                message: query.trim(),
                context: { page: "/help", selectedContact: null, role: "staff" },
            });
            setAnswer(data.reply || "No answer available.");
        } catch (error) {
            setAnswer(error.message || "Could not get a response. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Help & Knowledge Base" subtitle="Guides for using the DPS CRM. Ask the AI assistant anything." />

            {/* AI Help Search */}
            <Card className="crm-card border-0 mb-4" style={{ background: "linear-gradient(135deg, #0f5c54 0%, #6e42a8 100%)", color: "#fff" }}>
                <Card.Body>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <FaRobot style={{ fontSize: "1.5rem" }} />
                        <h5 className="mb-0 fw-bold">Ask the AI Assistant</h5>
                    </div>
                    <p className="small mb-3" style={{ opacity: 0.9 }}>
                        Type your question (e.g., "How do I create a drip campaign?", "Where are uploaded documents?", "How do I invite staff?") and get an instant answer.
                    </p>
                    <div className="d-flex gap-2">
                        <Form.Control
                            placeholder="Type your question here..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
                            style={{ borderRadius: 999 }}
                        />
                        <Button variant="light" onClick={ask} disabled={loading || !query.trim()} style={{ borderRadius: 999, fontWeight: 700 }}>
                            {loading ? <Spinner animation="border" size="sm" /> : <FaSearch />}
                        </Button>
                    </div>
                    {answer && (
                        <div className="mt-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.15)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                            {answer}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Row className="g-3">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Col md={6} lg={4} key={section.title}>
                            <Card className="crm-card border-0 h-100">
                                <Card.Header
                                    className="card-header-clean d-flex align-items-center gap-2"
                                    style={{ borderLeft: `4px solid ${section.color}` }}
                                >
                                    <Icon style={{ color: section.color }} />
                                    <span className="fw-bold">{section.title}</span>
                                </Card.Header>
                                <Card.Body>
                                    <ul className="mb-0 ps-3">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="small mb-1" style={{ lineHeight: 1.5 }}>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
            <div className="crm-card border-0 p-4 mt-4 text-center">
                <h5 className="mb-2">Need more help?</h5>
                <p className="text-muted mb-0">
                    Contact DPS at <strong>(973) 327-2340</strong> or{" "}
                    <a href="mailto:info@DPStaxpro.com">info@DPStaxpro.com</a>.
                </p>
            </div>
        </AppLayout>
    );
}

export default HelpPage;
