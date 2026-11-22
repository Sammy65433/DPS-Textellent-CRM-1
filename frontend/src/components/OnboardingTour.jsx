import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaQuestionCircle, FaTimes } from "react-icons/fa";

const TOURS = {
  "/dashboard": [
    { selector: null, title: "Welcome to DPS CRM 👋", text: "This is your Dashboard — your daily command center. Let's take a quick tour of everything." },
    { selector: '[data-tour="dashboard-stats"]', title: "Stats Overview", text: "See counts for contacts, messages, text blasts, drip campaigns, and emails at a glance. These update in real time. Click any card to jump to that section." },
    { selector: '[data-tour="dashboard-appointments"]', title: "Today's Appointments", text: "Appointments scheduled for today appear here. Click 'View Calendar' to open the full booking calendar." },
    { selector: '[data-tour="dashboard-week"]', title: "This Week's Bookings", text: "A quick view of all bookings this week, color-coded by preparer (blue=Pierre, purple=Dalia, green=Severe, orange=Jean, pink=Ricot). Real estate shows in teal (DPS Realty)." },
    { selector: '[data-tour="dashboard-followups"]', title: "AI Follow-Up Suggestions", text: "AI analyzes your contacts and suggests follow-ups based on days since last contact, missing info, and tags. Click 'Refresh' to re-analyze. Click a suggestion to act on it." },
    { selector: '[data-tour="dashboard-insights"]', title: "📊 AI Revenue Insights", text: "AI reviews your appointments, contacts, campaigns, and emails to surface revenue trends, busy periods, top services, preparer workload balance, and outreach gaps. Each insight includes a priority (high/medium/low) and a recommended action. Click 'Refresh' to re-analyze with the latest data." },
    { selector: '[data-tour="dashboard-messages"]', title: "Front-Page Booking Messages", text: "Messages submitted from the DPS website booking form appear here. Staff can delete them (with a confirmation prompt and audit log). Use the × button or bulk-select checkboxes." },
    { selector: '[data-tour="dashboard-quick-actions"]', title: "Quick Actions", text: "Use this dropdown to quickly navigate to Contacts, Emails, Templates, Campaigns, or Booking. Keeps you one click away from any section." },
    { selector: null, title: "AI Chat (bottom-right)", text: "Click the robot button (🤖) to open the DPS CRM Assistant. Ask anything: 'How do I send a campaign?', 'Where are uploaded documents?', 'How do I invite staff?'." },
    { selector: null, title: "Onboarding Tour (bottom-right)", text: "Click the ? button (here) anytime to restart this tour on any page. Each page has its own detailed tour." },
    { selector: null, title: "You're all set! 🎉", text: "Explore the sidebar for more pages. Let's move on to Contacts next." },
  ],
  "/contacts": [
    { selector: null, title: "Contacts Page", text: "Manage all your client contacts here. This is where you add, edit, search, and view client details." },
    { selector: '[data-tour="contacts-search"]', title: "AI Search", text: "Type natural language like 'contacts missing email' or 'clients tagged lead' and AI filters the list for you. Click 'Clear' to reset." },
    { selector: '[data-tour="contacts-list"]', title: "Contacts List", text: "Click a contact to view their details. Use the dropdown for quick selection with 100+ contacts. Search bar filters by name, phone, email, tags, or notes." },
    { selector: '[data-tour="contacts-summary"]', title: "Contact Details", text: "View contact info, tags, notes, birthday, and recent activity. Shows SMS/Email counts. Click 'Generate AI Summary' for a 2-3 sentence brief based on their info and message history." },
    { selector: '[data-tour="contacts-ai-summary"]', title: "AI Summary", text: "Click 'Generate AI Summary' to get a quick brief of this contact — key facts, situation, and suggested follow-up actions. Great for prep before reaching out." },
    { selector: '[data-tour="contacts-suggest-tags"]', title: "AI Suggest Tags", text: "Click 'Suggest Tags' to have AI analyze the contact's info, messages, and emails, then suggest relevant tags (e.g., '1099-filer', 'needs-follow-up'). Click a tag badge to see how to apply it." },
    { selector: '[data-tour="contacts-documents"]', title: "Client Documents", text: "If the contact is linked to a client account, their uploaded documents (PDFs, images) appear here. Click 'Connect client account' to link by email. Click 'AI' next to a document to extract data with OCR." },
    { selector: '[data-tour="contacts-suggest-replies"]', title: "AI Suggest Replies", text: "In the conversation panel, click 'Suggest Replies' to get 3 AI-drafted SMS replies based on the conversation. Click one to fill the message box instantly." },
    { selector: '[data-tour="contacts-add"]', title: "Add/Edit Contact", text: "Add new contacts or edit existing ones. Fields: First name, Last name, Phone, Email, Birthday, Tags (comma-separated), Notes, Custom Fields. Click 'Update Contact' to save changes. Use '+ Add Contact' button for a dedicated page." },
    { selector: null, title: "Import CSV", text: "Click '📥 Import CSV' to bulk-import contacts from a CSV file. The CSV must include a 'phone' column. Duplicates by phone are skipped. Columns: firstName, lastName, phone, email, tags, notes, birthday." },
    { selector: null, title: "Contact Lists", text: "Group contacts into named lists using the 'All lists' dropdown. Filter contacts by list. Lists help target campaigns and drips." },
    { selector: null, title: "Custom Fields", text: "Add arbitrary key/value fields to any contact (e.g., Date of Birth, Tax Year, Referral Source). Manage them in the Add/Edit Contact form." },
    { selector: '[data-tour="contacts-ai-summary"]', title: "Save AI Summary to Notes", text: "After generating an AI summary, click 'Save to Notes' to append it to the contact's notes (prefixed 'AI Summary:'). Great for keeping a record of AI insights." },
    { selector: null, title: "Done! 🎉", text: "You can now manage contacts, send messages/emails, and track conversations." },
  ],
  "/templates": [
    { selector: null, title: "Templates Page", text: "Create reusable message and email templates for campaigns and individual outreach." },
    { selector: '[data-tour="templates-form"]', title: "Create Template", text: "Enter a name, category, and body. Use {{firstName}}, {{lastName}}, or {{fullName}} placeholders for personalization. Click 'Create Template' to save." },
    { selector: '[data-tour="templates-list"]', title: "Template List", text: "All your templates appear here. Use the action buttons (Edit, Use for Campaign, Send as SMS/Email, Booking Reminder, Delete) on each card. Templates can be used in campaigns, drips, and individual messages/emails." },
    { selector: null, title: "Done! 🎉", text: "Templates save time by letting you reuse messages. Placeholders are replaced with the contact's actual info when sending." },
  ],
  "/campaigns": [
    { selector: null, title: "Campaigns Page", text: "Create and send bulk campaigns to selected contacts via SMS, email, or both." },
    { selector: '[data-tour="campaigns-form"]', title: "Create Campaign", text: "Name your campaign, choose type (SMS/Email/Both), select a template, pick recipients, and optionally schedule for later. Click 'Create Campaign' when ready." },
    { selector: '[data-tour="campaigns-ai"]', title: "AI Generate Copy", text: "Click 'AI Generate Copy' to have AI draft a subject + body from your goal description. Choose audience and tone, then click 'Generate & Create Template'. The template auto-selects." },
    { selector: null, title: "Campaign Tips", text: "You can also type a message directly in the body field (overrides template). Use {{firstName}}/{{lastName}}/{{fullName}} placeholders. Preview shows how the message looks to a selected contact." },
    { selector: '[data-tour="campaigns-list"]', title: "Campaign List", text: "View all campaigns, their status, and recipient counts. Delete any campaign (including sent ones). Click a campaign to edit." },
    { selector: null, title: "Note", text: "Campaign sending is currently in draft mode (consent implementation pending). Campaigns can be created, previewed, and deleted. SMS is in mock mode." },
    { selector: null, title: "Done! 🎉", text: "Campaigns help you reach multiple contacts at once. Use AI to generate copy quickly." },
  ],
  "/emails": [
    { selector: null, title: "Emails Page", text: "View and send individual emails to contacts." },
    { selector: '[data-tour="emails-list"]', title: "Email History", text: "All sent emails appear here, grouped by contact. Click a contact to view their email thread." },
    { selector: '[data-tour="emails-compose"]', title: "Compose Email", text: "Select a contact, choose a template (or type your own), and send. Templates support {{firstName}}, {{lastName}}, {{fullName}} placeholders. Use the 'AI Generate Copy' on the Campaigns page for AI-drafted templates." },
    { selector: null, title: "Done! 🎉", text: "Emails are sent via Resend. Check the contact's email tab for conversation history." },
  ],
  "/booking": [
    { selector: null, title: "Booking Calendar", text: "Manage all appointments here. Switch between Day, Week, and Month views using the buttons at the top." },
    { selector: '[data-tour="booking-calendar"]', title: "Calendar", text: "Days with appointments show colored chips (time + client name). Click a day to see appointments. Each preparer has their own color: Pierre=blue, Dalia=purple, Severe=green, Jean=orange, Ricot=pink. Real estate shows in teal (DPS Realty)." },
    { selector: '[data-tour="booking-ai"]', title: "AI Schedule", text: "Type a request like 'Book Omar for 60-min tax prep next Tuesday afternoon' and AI fills in the form fields. Click 'Suggest & Apply' then 'Book Now' to create the appointment." },
    { selector: '[data-tour="booking-form"]', title: "Book Appointment", text: "Select service, preparer, date, time, and visit format. Fill in client details (name, phone, email). Click 'Book Your Appointment' to create. Real estate services are handled by DPS Realty." },
    { selector: null, title: "Done! 🎉", text: "Appointments sync with the DPS website. Clients can manage their appointments via the emailed 'Manage My Appointment' link." },
  ],
  "/analytics": [
    { selector: null, title: "Analytics Page", text: "View booking trends, contact growth, and outreach activity. Use the date range selector to filter data." },
    { selector: '[data-tour="analytics-range"]', title: "Date Range", text: "Filter all appointment data by the last 7, 30, or 90 days. Metrics and charts update automatically." },
    { selector: '[data-tour="analytics-kpis"]', title: "Key Metrics", text: "Quick stats: Booked, Confirmed, Cancelled appointments, Contacts Added, Campaigns Sent, SMS count, Emails count, and Templates count." },
    { selector: '[data-tour="analytics-trend"]', title: "Appointments by Date", text: "Area chart showing appointment volume over time. Helps you spot busy periods and trends." },
    { selector: '[data-tour="analytics-services"]', title: "Bookings by Service", text: "Horizontal bar chart showing which services are most popular. Helps you understand demand." },
    { selector: '[data-tour="analytics-preparers"]', title: "Bookings by Preparer", text: "Shows workload distribution across preparers. Helps balance scheduling." },
    { selector: '[data-tour="analytics-activity"]', title: "SMS & Email Activity", text: "Area chart of outreach activity over time. Shows your communication volume." },
    { selector: '[data-tour="analytics-insights"]', title: "📊 AI Revenue Insights", text: "AI reviews your appointments, contacts, campaigns, and emails to surface revenue trends, busy periods, top services, preparer workload balance, and outreach gaps. Each insight includes a priority (high/medium/low) and a recommended action. Click 'Refresh' to re-analyze with the latest data." },
    { selector: null, title: "Done! 🎉", text: "Use these insights to optimize scheduling, balance workloads, and improve outreach." },
  ],
  "/staff": [
    { selector: null, title: "Staff Management", text: "Admin-only page to invite and manage staff accounts." },
    { selector: '[data-tour="staff-invite"]', title: "Invite Staff", text: "Enter first name, last name, and email. An invitation email is sent with a one-time setup link (expires in 24 hours). Staff set their own password." },
    { selector: '[data-tour="staff-list"]', title: "Staff List", text: "View all staff accounts with their role and status. Use Deactivate/Reactivate to manage access. You cannot deactivate your own account." },
    { selector: null, title: "Done! 🎉", text: "Staff log in with their email + password. Accounts must be active to access the CRM. Admins can invite new staff anytime." },
  ],
  "/media": [
    { selector: null, title: "Media Library", text: "Upload and manage media files (images, PDFs, etc.) for use in campaigns and emails." },
    { selector: null, title: "Upload", text: "Click 'Upload File' to add a file (max 5MB). Images are previewed in the grid. Copy the file URL to use in campaigns/emails." },
    { selector: null, title: "Manage", text: "Delete files you no longer need. Uploaded files are stored securely and accessible via their URL." },
    { selector: null, title: "Done! 🎉", text: "Media files can be referenced in email/campaign bodies by their URL." },
  ],
  "/drip-campaigns": [
    { selector: null, title: "Drip Campaigns 📧", text: "Create timed email sequences (drips) that send automatically to enrolled contacts at scheduled intervals. Great for welcome series, follow-ups, and re-engagement." },
    { selector: null, title: "Step 1 — Name it", text: "Enter a clear campaign name (e.g., 'Welcome Series' or 'April 15 Reminder'). This is for your reference only." },
    { selector: null, title: "Step 2 — Add Steps", text: "Each step is one email. Set the delay in days (0 = send immediately on enrollment, 3 = wait 3 days, etc.), then write a subject and body. Use {{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{companyPhone}} placeholders — they auto-fill per contact." },
    { selector: null, title: "Step 3 — Use a Template", text: "Each step has a 'Use a template' dropdown. Pick an existing template to auto-fill the body, then tweak as needed." },
    { selector: null, title: "Step 4 — AI Generate", text: "Use the 'AI Generate Step' panel: pick a step number, type a goal (e.g., 'welcome new clients and ask them to upload documents'), click Generate. AI fills that step's subject + body. Review and edit before saving." },
    { selector: null, title: "Step 5 — Enroll Contacts", text: "Check the contacts you want to enroll. They must have an email address. Click 'Create & Enroll' to start the drip." },
    { selector: null, title: "How it runs", text: "The scheduler checks every minute. When a step's delay has passed, it sends the email and advances to the next step. When all steps are done, the enrollment completes. Drips run in the background — you don't need to be logged in." },
    { selector: null, title: "Tips", text: "Start with delay 0 for the first email (immediate welcome), then 3-7 days for follow-ups. Keep bodies under 500 chars for best deliverability. Test on yourself first." },
    { selector: null, title: "Done! 🎉", text: "Drip campaigns help you stay in touch automatically. Check the list for status and step progress." },
  ],
};

const DEFAULT_TOUR = [
  { selector: null, title: "Welcome to DPS CRM 👋", text: "Use the sidebar to navigate. Click the ? button anytime for a guided tour of the current page." },
];

export default function OnboardingTour() {
  const location = useLocation();
  const steps = TOURS[location.pathname] || DEFAULT_TOUR;

  const [step, setStep] = useState(-1);
  const [targetRect, setTargetRect] = useState(null);

  const started = step >= 0 && step < steps.length;
  const current = started ? steps[step] : null;

  useEffect(() => {
    if (!started || !current?.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(current.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step, started, current]);

  // Reset step when route changes
  useEffect(() => {
    setStep(-1);
  }, [location.pathname]);

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else setStep(-1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function skip() {
    setStep(-1);
  }

  if (step === -1) {
    return (
      <button
        type="button"
        className="tour-help-btn"
        onClick={() => setStep(0)}
        aria-label="Start onboarding tour"
        title="Take a quick tour of this page"
      >
        <FaQuestionCircle />
      </button>
    );
  }

  return (
    <>
      <div className="tour-overlay" onClick={skip} />

      {targetRect && (
        <div
          className="tour-spotlight"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      <div className="tour-card">
        <button type="button" className="tour-card-close" onClick={skip} aria-label="Close tour">
          <FaTimes />
        </button>
        <h3 className="tour-card-title">{current.title}</h3>
        <p className="tour-card-text">{current.text}</p>
        <div className="tour-card-actions">
          {step > 0 && (
            <Button size="sm" variant="outline-secondary" onClick={back}>
              Back
            </Button>
          )}
          <span className="tour-card-progress">
            {step + 1} / {steps.length}
          </span>
          <Button size="sm" variant="primary" onClick={next}>
            {step === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}