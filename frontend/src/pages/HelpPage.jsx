import AppLayout from "../components/AppLayout";
import PageHeader from "../components/PageHeader";

function HelpPage({ theme, onToggleTheme }) {
    return (
        <AppLayout theme={theme} onToggleTheme={onToggleTheme}>
            <PageHeader title="Help & Knowledge Base" subtitle="Guides for using the DPS CRM." />
            <div className="crm-card border-0 p-4">
                <h5>Getting Started</h5>
                <ul>
                    <li><strong>Dashboard:</strong> Overview of contacts, templates, campaigns, emails, and appointments. Click the ? button for a guided tour.</li>
                    <li><strong>Contacts:</strong> Add/edit contacts, send SMS/emails, upload documents, AI search/summary/suggest tags.</li>
                    <li><strong>Templates:</strong> Create reusable message templates with placeholders ({{firstName}}, {{lastName}}, {{companyName}}, etc.).</li>
                    <li><strong>Campaigns:</strong> Create bulk SMS/email campaigns to selected contacts. Use AI to generate copy.</li>
                    <li><strong>Emails:</strong> View and send individual emails. AI Generate Email + Suggest Replies available.</li>
                    <li><strong>Media:</strong> Upload images/PDFs for use in campaigns and emails.</li>
                    <li><strong>Drip Campaigns:</strong> Timed email sequences with auto-enrollment and background sending.</li>
                    <li><strong>Automations:</strong> Configure out-of-office, after-hours, and birthday auto-responders (SMS + Email).</li>
                    <li><strong>Analytics:</strong> Booking trends, contact growth, outreach activity, AI Revenue Insights.</li>
                    <li><strong>Booking:</strong> Full calendar (day/week/month). Create/edit/cancel appointments. AI scheduling.</li>
                    <li><strong>Staff Management (admin):</strong> Invite staff, deactivate/reactivate accounts.</li>
                </ul>
                <h5 className="mt-3">Need more help?</h5>
                <p>Contact DPS at (973) 327-2340 or info@DPStaxpro.com.</p>
            </div>
        </AppLayout>
    );
}

export default HelpPage;
