import { Card, Col, Row } from "react-bootstrap";
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
} from "react-icons/fa";
import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";

const SECTIONS = [
    {
        icon: FaColumns,
        title: "Dashboard",
        color: "#0f5c54",
        items: [
            "Overview of contacts, templates, campaigns, emails, and appointments.",
            "Today's appointments and this week's bookings at a glance.",
            "Quick Actions dropdown for one-click navigation.",
            "AI Follow-Up Suggestions and AI Revenue Insights.",
            "Front-page booking messages from the DPS website.",
        ],
    },
    {
        icon: FaUsers,
        title: "Contacts",
        color: "#6e42a8",
        items: [
            "Add, edit, delete contacts (or use the dedicated Add Contact page).",
            "Search by name, phone, email, tags, or notes.",
            "Filter by status (Active/Inactive/Recent) and tags.",
            "Import contacts from CSV (phone column required).",
            "Group contacts into named lists and filter by list.",
            "Custom fields (e.g., Date of Birth) on each contact.",
            "AI Search (natural language), AI Summary (save to notes), Suggest Tags.",
            "Send SMS/Email, book appointments, send account-link invitations.",
            "View conversation history, documents, and AI smart replies.",
        ],
    },
    {
        icon: FaFileAlt,
        title: "Templates",
        color: "#f59e0b",
        items: [
            "Create reusable SMS/email templates.",
            "Placeholders: {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{companyPhone}}, {{companyEmail}}, {{companyAddress}}, {{companyWebsite}}.",
            "AI Generate Template from a goal description.",
            "Edit or delete templates; use them in campaigns and individual messages.",
            "Action buttons: Use for Campaign, Send as SMS, Send as Email, Booking Reminder.",
        ],
    },
    {
        icon: FaBullhorn,
        title: "Campaigns",
        color: "#dc2626",
        items: [
            "Create bulk SMS/email campaigns to selected contacts.",
            "Choose a template or type a message directly (overrides template).",
            "AI Generate Copy from a goal + audience + tone.",
            "Schedule campaigns for later; edit name/type/status/subject/body/template.",
            "View status (draft/scheduled/sent), recipient counts, delete campaigns.",
        ],
    },
    {
        icon: FaEnvelope,
        title: "Emails",
        color: "#2563eb",
        items: [
            "View and send individual emails to contacts.",
            "Choose a template or type your own body.",
            "AI Generate Email (subject + body from a goal).",
            "AI Suggest Replies based on email history.",
            "AI Summary of the contact's email thread (save to notes).",
            "Delete individual emails or entire conversations.",
        ],
    },
    {
        icon: FaImage,
        title: "Media Library",
        color: "#0891b2",
        items: [
            "Upload images/PDFs (max 5MB).",
            "Grid view with image previews.",
            "Reference files by URL in emails and campaigns.",
            "Delete files you no longer need.",
        ],
    },
    {
        icon: FaPaperPlane,
        title: "Drip Campaigns",
        color: "#7c3aed",
        items: [
            "Timed email sequences with multiple steps.",
            "Each step: delay (days), subject, body. Use placeholders.",
            "AI Generate per step + template selector.",
            "Enroll contacts; emails send automatically in the background.",
            "Scheduler runs every minute; no need to be logged in.",
        ],
    },
    {
        icon: FaCalendarCheck,
        title: "Booking",
        color: "#16a34a",
        items: [
            "Full calendar (Day/Week/Month views).",
            "Create, edit, cancel appointments (tax + realty).",
            "AI Schedule: type a request, AI fills the form and can auto-book.",
            "Block out time (lunch, meetings).",
            "Color-coded by preparer; real estate in teal.",
        ],
    },
    {
        icon: FaChartBar,
        title: "Analytics",
        color: "#ea580c",
        items: [
            "KPIs: Booked, Confirmed, Cancelled, Contacts, Campaigns, SMS, Emails, Templates.",
            "Charts: appointments by date, by service, by preparer, SMS/email activity.",
            "Date range filter (7/30/90 days).",
            "AI Revenue Insights with priority + recommendations.",
            "Tabs: Dashboard, Messages, Text Blast, Automations, Auto Responders.",
        ],
    },
    {
        icon: FaRobot,
        title: "Automations",
        color: "#db2777",
        items: [
            "Out-of-Office Responder (date range + SMS/Email messages).",
            "After-Hours Responder (time window + SMS/Email messages).",
            "Birthday Greeting (daily at 9 AM ET, SMS/Email).",
            "Channels: SMS only, Email only, or SMS + Email.",
        ],
    },
    {
        icon: FaUserShield,
        title: "Staff Management (Admin)",
        color: "#0f5c54",
        items: [
            "Invite staff (email + one-time setup link, 24h expiry).",
            "Deactivate/reactivate accounts. Cannot deactivate yourself.",
            "Role-based: admin vs. staff.",
        ],
    },
];

function HelpPage({ theme, onToggleTheme }) {
    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Help & Knowledge Base" subtitle="Guides for using the DPS CRM." />
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
