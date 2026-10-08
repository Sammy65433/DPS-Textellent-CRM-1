DPS Textellent CRM

A lightweight CRM and outreach platform for DPS built for SMS and email communication.  
The app supports contact management, conversation history, templates, campaigns, and dashboard-based outreach workflows.

Features

- SMS messaging
- Email messaging
- Contact management
- Message history by contact
- Email history by contact
- Reusable templates
- Bulk/campaign messaging
- Dashboard with recent activity
- Light and dark mode
- Delete single messages/emails
- Delete full message/email conversations
- MongoDB-backed data storage
- Mock SMS mode for development

Core Purpose

This app is designed to help manage outreach and engagement through:
- texting/SMS
- email
- contact lists
- campaigns
- templates
- replies/inbound messages
- message history
- basic reporting/dashboard visibility

Tech Stack

Frontend
- React
- Vite
- React Router
- React Bootstrap
- React Icons
- Custom CSS

Backend
- Node.js
- Express
- MongoDB + Mongoose
- Twilio for SMS
- Resend for email

Database Models

- contacts
- messages
- emailMessages
- templates
- campaigns

Current Functionality

Contacts
- Create contact
- Edit contact
- Delete contact
- Shared across SMS and Email pages

SMS
- Send single SMS
- Send SMS using templates
- Inbound webhook logging
- View conversation by contact
- Delete single message
- Delete full conversation

Email
- Send single email
- Send email using templates
- View email history by contact
- Delete single email
- Delete full email conversation

Templates
- Create template
- Delete template
- Use templates in SMS and Email

Campaigns
- Create campaign
- Send campaign to selected contacts
- Delete campaign

Dashboard
- Stats cards
- Recent messages
- Recent emails
- Recent campaigns
- Quick actions
- Tasks and follow-ups

Project Structure

- frontend/
  - pages/
  - components/
  - handlers/
  - api/
  - styles/

- backend/
  - controllers/
  - routes/
  - models/
  - services/
  - config/

What Was Built in Order

1. Backend foundation
2. MongoDB models and controllers
3. Contacts CRUD
4. SMS send and logging
5. Templates
6. Campaigns
7. Inbound webhook support
8. Email send and history
9. Frontend dashboard and page routing
10. Edit/delete flows
11. Theme support

Where I Left Off

The app is mostly functional and at a strong MVP stage.

Completed
- backend API
- MongoDB integration
- contacts
- SMS conversations
- email conversations
- templates
- campaigns
- dashboard
- page routing
- dark/light theme
- delete single and delete-all actions

Likely next steps
- fix any remaining dark mode styling inconsistencies
- improve email template autofill UX
- refine page styling consistency
- add search/filtering for contacts
- add auth/login
- add scheduling
- add analytics/reporting
- add real Twilio production compliance flow
- improve form validation and error handling

Recommended Next Features

High priority
- Contact search
- Tag filtering
- Better alerts/toasts
- Confirm delete modals
- Auth/user accounts

Medium priority
- Scheduled campaigns
- Email open/click tracking
- Campaign analytics
- Pagination
- Contact notes

Later
- File attachments
- User roles
- Advanced reporting
- CSV import/export
- Real production deployment polish

MVP Scope

This MVP currently covers:
- contacts
- send single SMS
- send single email
- templates
- bulk/campaign send
- webhook for incoming replies
- message history/status

Still to expand
- users/auth
- scheduling
- analytics/reporting
- production-grade multi-user support

Development Notes

- SMS can run in mock mode for development
- Email uses Resend
- MongoDB stores all messages, emails, contacts, templates, and campaigns
- Frontend uses route-based pages:
  - Dashboard
  - Contacts
  - Templates
  - Campaigns
  - Emails



Best next Textellent-style features to add:

- **Scheduled sends** for SMS/email
- **Opt-out / STOP handling**
- **Tag-based campaigns** like `vip`, `tax`, `real-estate`
- **Search + filters** for contacts/messages
- **Conversation notes** per contact
- **Delivery status tracking** for SMS/email
- **Template categories**
- **CSV import/export**
- **Campaign analytics**:
  - sent
  - failed
  - replied
  - opened for email
- **User auth / multi-user accounts**
- **Contact activity timeline**
- **Reminders / follow-up tasks**
- **Pipeline/stages** like:
  - lead
  - contacted
  - follow-up
  - client
- **File attachments / document links**
- **Segmented campaigns**:
  - by tags
  - by missing docs
  - by appointment status

Most aligned with what your dad described:
1. **mass texting**
2. **scheduling**
3. **reply handling**
4. **analytics/reporting**
5. **contact segmentation**
6. **templates**
7. **campaign management**





      




The Admin badge and dashboard appointment card are working. The main unfinished items are:

- **Staff onboarding:** Build the password-setup endpoint before sending invitations. Keep public registration disabled, and enforce `active: true` at login after approved existing accounts are updated.
- **Staff permissions and audit logs:** Record who edits or cancels bookings. The visible Admin badge is not an authorization check.
- **Campaign safety:** Add channel-specific consent and opt-out checks before sending or scheduling. Calendar campaign buttons currently pass appointment IDs but do not create recipient-ready drafts.
- **CRM data security:** Existing contact and campaign routes still trust browser-supplied `userId`. Secure them before giving multiple staff accounts access.
- **Booking rules:** Align backend hours with the office’s tax-season and off-season hours.

Here is a README you can paste into the **CRM project’s `README.md`**. It covers the work discussed today while separating completed features from unfinished ones:

```md
# DPS CRM

A staff-facing CRM for DPS Professional Tax Services. It brings contacts, SMS and email outreach, templates, campaigns, analytics, and appointment management into one interface. The CRM connects to the separate DPS booking backend, which stores appointments in Supabase.

## Tech stack

- Frontend: React, Vite, React Router, React Bootstrap, React Icons, Recharts, CSS
- CRM backend: Node.js, Express, MongoDB, Mongoose
- DPS booking backend: Node.js, Express, Supabase
- Email: Resend
- SMS: Twilio integration with mock SMS mode for development

## What works

### Staff dashboard

- Displays CRM counts for contacts, messages, templates, campaigns, and emails.
- Displays the number of active appointments scheduled for today.
- Links to the Booking calendar.
- Shows a chart comparing communications activity with scheduled appointments.

### Booking calendar

- Shows active booked and confirmed appointments on a monthly calendar.
- Displays appointment counts by day and supports a selected-day or All Appointments view.
- Lets staff create an appointment by selecting a service, preparer, duration, date, and available time.
- Lets staff edit an appointment's service, preparer, date, time, and length.
- Lets staff cancel an appointment after a confirmation prompt.
- Lets staff import a booking's customer into CRM Contacts, with a duplicate check.
- Uses the DPS backend for availability and booking data. Appointment details are loaded through a staff-protected CRM backend proxy.
- Customer booking, update, and cancellation emails are sent by the DPS backend.

### Contacts and communication

- Create, search, filter, edit, and delete contacts.
- View contact SMS and email history.
- Send individual SMS and email messages.
- Create and preview reusable templates.
- Create campaigns using selected contacts and a chosen template.
- Campaign form offers SMS, email, and both. SMS can run in mock mode; email-only campaign sending was tested.

### Analytics

- Appointment counts and charts by scheduled date, service, and preparer.
- Date-range counts for contacts added and campaigns sent.
- SMS, email, template, and campaign-status summaries.
- Some measures are approximations: campaign send time may fall back to `updatedAt`. Reschedule history and campaign-to-booking attribution are not recorded.

### Login and roles

- CRM login uses a JWT.
- Public registration is disabled.
- Approved users can be assigned `staff` or `admin` roles in MongoDB.
- The navigation displays the logged-in user's role.
- Staff appointment-list and contact-import endpoints use backend authentication and role checks.
- DPS appointment-list and staff change endpoints require a server-to-server key that is kept out of frontend environment variables.

### Customer appointment management

The public DPS site has a separate private Manage My Appointment page. A booking email includes an expiring link for that appointment. Customers can review its details, change the service, preparer, date, time, or duration, and cancel it. This page must never display other customers' appointments.

## Project structure

```text
frontend/
  src/
    components/
    pages/
    handlers/
    api/
    styles/
backend/
  controllers/
  middleware/
  models/
  routes/
  services/
  config/
```

The DPS website and booking backend are separate from this CRM project.

## Local development

1. Install dependencies in `frontend/` and `backend/`.
2. Set the CRM backend environment variables, including MongoDB, JWT, Resend, and the DPS server-to-server connection.
3. Set the CRM frontend API URLs.
4. Start both the CRM backend and frontend.
5. Keep secrets out of frontend files and Git.

Example CRM frontend environment variables:

```env
VITE_API_URL=http://localhost:5002
VITE_DPS_API_URL=https://dps-final-tax-website.onrender.com
```

The CRM backend uses `DPS_API_URL` and `DPS_STAFF_API_KEY` as server-only variables. The same staff API key must be configured on the DPS backend. Never put that key in a `VITE_` variable.

## Important limitations and next steps

1. Finish admin-only staff invitations: create the one-time password-setup endpoint and page before inviting staff.
2. Protect CRM contact, campaign, message, and email routes with authenticated user or organization scoping. Do not trust `userId` supplied by the browser.
3. Record marketing consent separately for SMS and email and honor opt-outs before campaign sends. Booking an appointment or importing a contact is not marketing consent.
4. Do not let the Campaigns edit form manually mark a campaign as `sent`. Track actual send results and failures.
5. Connect calendar-selected appointment clients to consent-eligible CRM contacts before enabling personal or group campaign drafts.
6. Add audit logs for staff appointment changes and cancellations.
7. Align public booking, staff booking, customer management, and backend validation with the office's approved seasonal hours.
8. Verify existing appointments, staff edits, and customer reschedules against the Supabase overlap constraint, and return clear conflict errors.
9. Keep private appointment-management links and all API credentials out of screenshots, logs, and Git.
```

The README deliberately does **not** claim that staff invitations, marketing consent enforcement, or calendar-to-campaign scheduling are complete.















