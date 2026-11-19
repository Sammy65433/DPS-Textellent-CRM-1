import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaQuestionCircle, FaTimes } from "react-icons/fa";

const TOURS = {
  "/dashboard": [
    { selector: null, title: "Welcome to DPS CRM 👋", text: "This is your Dashboard — your daily command center. Let's take a quick tour." },
    { selector: '[data-tour="dashboard-stats"]', title: "Stats Overview", text: "See counts for contacts, messages, templates, campaigns, and emails at a glance." },
    { selector: '[data-tour="dashboard-appointments"]', title: "Today's Appointments", text: "Appointments scheduled for today appear here. Click one to view details." },
    { selector: '[data-tour="dashboard-week"]', title: "This Week's Bookings", text: "A quick view of all bookings this week, color-coded by preparer." },
    { selector: '[data-tour="dashboard-messages"]', title: "Front-Page Booking Messages", text: "Messages submitted from the DPS website booking form appear here. Staff can delete them (with confirmation + audit log)." },
    { selector: '[data-tour="dashboard-followups"]', title: "AI Follow-Up Suggestions", text: "AI analyzes your contacts and suggests follow-ups. Click 'Refresh' to re-analyze." },
    { selector: '[data-tour="dashboard-quick-actions"]', title: "Quick Actions", text: "Use this dropdown to quickly navigate to Contacts, Emails, Templates, Campaigns, or Booking." },
    { selector: null, title: "You're all set! 🎉", text: "Explore the sidebar for more pages. Click the robot button (bottom-right) anytime for AI help." },
  ],
  "/contacts": [
    { selector: null, title: "Contacts Page", text: "Manage all your client contacts here." },
    { selector: '[data-tour="contacts-search"]', title: "AI Search", text: "Type natural language like 'contacts missing email' and AI filters the list for you." },
    { selector: '[data-tour="contacts-list"]', title: "Contacts List", text: "Click a contact to view their details, messages, emails, and documents. Use the dropdown for quick selection." },
    { selector: '[data-tour="contacts-summary"]', title: "Contact Details", text: "View contact info, tags, notes, birthday, and recent activity. Click 'Generate AI Summary' for a quick brief." },
    { selector: '[data-tour="contacts-documents"]', title: "Client Documents", text: "If the contact is linked to a client account, their uploaded documents appear here. Click 'Connect client account' to link by email." },
    { selector: '[data-tour="contacts-add"]', title: "Add/Edit Contact", text: "Add new contacts or edit existing ones. Fill in name, phone, email, tags, notes, and birthday." },
    { selector: null, title: "Done! 🎉", text: "You can now manage contacts, send messages/emails, and track conversations." },
  ],
  "/templates": [
    { selector: null, title: "Templates Page", text: "Create reusable message and email templates." },
    { selector: '[data-tour="templates-form"]', title: "Create Template", text: "Enter a name, category, and body. Use {{firstName}}, {{lastName}}, or {{fullName}} placeholders." },
    { selector: '[data-tour="templates-list"]', title: "Template List", text: "All your templates appear here. Click to edit or delete." },
    { selector: null, title: "Done! 🎉", text: "Templates can be used in campaigns and individual messages/emails." },
  ],
  "/campaigns": [
    { selector: null, title: "Campaigns Page", text: "Create and send bulk campaigns to selected contacts." },
    { selector: '[data-tour="campaigns-form"]', title: "Create Campaign", text: "Name your campaign, choose SMS/Email/Both, select a template, pick recipients, and schedule if needed." },
    { selector: '[data-tour="campaigns-ai"]', title: "AI Generate Copy", text: "Click 'AI Generate Copy' to have AI draft a subject + body from your goal description." },
    { selector: '[data-tour="campaigns-list"]', title: "Campaign List", text: "View all campaigns, their status, and recipient counts. Delete any campaign." },
    { selector: null, title: "Done! 🎉", text: "Campaigns are saved as drafts. Sending requires consent implementation (coming soon)." },
  ],
  "/emails": [
    { selector: null, title: "Emails Page", text: "View and send individual emails to contacts." },
    { selector: '[data-tour="emails-list"]', title: "Email History", text: "All sent emails appear here, grouped by contact." },
    { selector: '[data-tour="emails-compose"]', title: "Compose Email", text: "Select a contact, choose a template, and send. Templates support {{firstName}}/{{lastName}}/{{fullName}}." },
    { selector: null, title: "Done! 🎉", text: "Emails are sent via Resend. Check the contact's email tab for conversation history." },
  ],
  "/booking": [
    { selector: null, title: "Booking Calendar", text: "Manage all appointments here. Switch between Day, Week, and Month views." },
    { selector: '[data-tour="booking-calendar"]', title: "Calendar", text: "Days with appointments show colored chips. Click a day to see appointments. Each preparer has their own color." },
    { selector: '[data-tour="booking-ai"]', title: "AI Schedule", text: "Type a request like 'Book Omar for 60-min tax prep next Tuesday' and AI fills in the form for you." },
    { selector: '[data-tour="booking-form"]', title: "Book Appointment", text: "Select service, preparer, date, time, and visit format. Real estate services are handled by DPS Realty." },
    { selector: null, title: "Done! 🎉", text: "Appointments sync with the DPS website. Clients can manage their appointments via the emailed link." },
  ],
  "/staff": [
    { selector: null, title: "Staff Management", text: "Admin-only page to invite and manage staff accounts." },
    { selector: '[data-tour="staff-invite"]', title: "Invite Staff", text: "Enter first name, last name, and email. An invitation email is sent with a setup link." },
    { selector: '[data-tour="staff-list"]', title: "Staff List", text: "View all staff accounts. Deactivate/reactivate as needed. You can't deactivate your own account." },
    { selector: null, title: "Done! 🎉", text: "Staff set their own password via the email link. Accounts become active after setup." },
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

  // Skip steps whose target element doesn't exist
  useEffect(() => {
    if (!started || !current) return;
    if (current.selector && !document.querySelector(current.selector)) {
      // skip this step
      if (step < steps.length - 1) setStep(step + 1);
      else setStep(-1);
    }
  }, [step, started, current, steps.length]);

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