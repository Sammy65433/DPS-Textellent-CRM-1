import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { FaQuestionCircle, FaTimes } from "react-icons/fa";

const TOUR_STEPS = [
  {
    selector: null,
    title: "Welcome to DPS CRM 👋",
    text: "This quick tour will show you around the main sections. You can skip at any time.",
  },
  {
    selector: '[href="/contacts"]',
    title: "Contacts",
    text: "Manage all your client contacts here. Add, edit, search, and view conversation history. Click a contact to see their details, documents, and messages.",
  },
  {
    selector: '[href="/templates"]',
    title: "Templates",
    text: "Create reusable message and email templates. Use {{firstName}} and {{lastName}} placeholders for personalization.",
  },
  {
    selector: '[href="/campaigns"]',
    title: "Campaigns",
    text: "Send bulk SMS or email campaigns to selected contacts. Use AI to generate copy, schedule for later, and track status.",
  },
  {
    selector: '[href="/emails"]',
    title: "Emails",
    text: "View and send individual emails to contacts. Supports templates with variable substitution.",
  },
  {
    selector: '[href="/booking"]',
    title: "Booking",
    text: "Full calendar view (day/week/month). Create, edit, and cancel appointments. Color-coded by preparer. Real estate appointments show in teal.",
  },
  {
    selector: '[href="/staff"]',
    title: "Staff Management (Admin only)",
    text: "Invite new staff members, deactivate/reactivate accounts. Only admins can access this page.",
  },
  {
    selector: null,
    title: "You're all set! 🎉",
    text: "Explore the dashboard for today's appointments, recent messages, and AI follow-up suggestions. Click the robot button (bottom-right) anytime for AI help.",
  },
];

export default function OnboardingTour() {
  const [step, setStep] = useState(-1); // -1 = not started
  const [targetRect, setTargetRect] = useState(null);

  const started = step >= 0 && step < TOUR_STEPS.length;
  const current = started ? TOUR_STEPS[step] : null;

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

  function next() {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
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
        title="Take a quick tour"
      >
        <FaQuestionCircle />
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="tour-overlay" onClick={skip} />

      {/* Spotlight */}
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

      {/* Tooltip card */}
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
            {step + 1} / {TOUR_STEPS.length}
          </span>
          <Button size="sm" variant="primary" onClick={next}>
            {step === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}