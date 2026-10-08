
https://dps-textellent-frontend.onrender.com

````md
# DPS Textellent CRM

A staff-facing CRM and outreach platform for DPS Professional Tax Services. It manages contacts, SMS and email conversations, templates, campaigns, analytics, and appointments.

The CRM is a separate application from the public DPS website. The DPS booking backend stores appointments in Supabase; the CRM backend stores CRM data in MongoDB.

## Tech stack

| Layer | Technology |
| --- | --- |
| CRM frontend | React, Vite, React Router, React Bootstrap, React Icons, Recharts, CSS |
| CRM backend | Node.js, Express, MongoDB, Mongoose, JWT |
| DPS booking backend | Node.js, Express, Supabase |
| Email | Resend |
| SMS | Twilio integration; mock SMS mode used during development |
| Hosting | Render |

## Applications and URLs

- Public DPS website: `https://www.dpstaxpro.com`
- DPS booking API: `https://dps-final-tax-website.onrender.com`
- CRM frontend: `https://dps-textellent-frontend.onrender.com`
- CRM backend: use the current URL shown on the CRM backend Render service. Verify it before updating frontend environment variables.

The CRM frontend is a Render Static Site with a rewrite from `/*` to `/index.html`, allowing React Router pages such as `/login` and `/setup-password` to open directly.

## Current functionality

### Dashboard

- Contact, SMS, email, template, and campaign summaries.
- Today's active appointment count from the staff-protected appointment endpoint.
- Link to the Booking calendar.
- Chart showing communication activity and scheduled appointments.
- Recent messages and emails.
- Quick actions and follow-up prompts.

The chart counts communications by message/email creation date and appointments by scheduled appointment date. These are different measures.

### Staff Booking calendar

- Month view with active appointment counts on each day.
- Calendar on the left and booking controls on the right on wider screens.
- Selected-day and All Appointments views.
- Available-time lookup by date, preparer, and appointment length.
- Create bookings for customers.
- Edit service, preparer, date, time, and duration on existing bookings.
- Staff edits can use 15-, 30-, or 60-minute durations. Public booking currently offers 30 or 60 minutes.
- Cancel an appointment after a confirmation prompt.
- Customer update and cancellation emails were tested.
- Add an appointment customer to CRM Contacts, with duplicate checking.
- Personal and group campaign buttons currently **only navigate and pass appointment IDs**. They do not create recipient-ready drafts or send campaigns.

Appointment details are loaded through a CRM backend endpoint protected by login and staff-role checks. The CRM backend uses a server-only key to call the DPS backend. Do not put this key in frontend code.

### Customer appointment management

The public DPS website has a separate, private **Manage My Appointment** page linked from a customer's booking email. Its expiring link lets the customer view and change only their appointment, including service, preparer, date, time, and 30- or 60-minute duration, or cancel it.

The DPS Supabase database has an `appointments_no_overlap` exclusion constraint to prevent overlapping active appointments for the same preparer. The DPS backend handles overlap conflicts for booking, staff edits, and customer rescheduling. Keep private manage links out of screenshots and logs.

### Contacts and communication

- Create, search, tag-filter, edit, and delete contacts.
- Confirmation prompt before deleting a contact.
- View SMS and email history by contact.
- Send individual SMS and emails.
- Reusable templates with contact-name placeholders.
- Import appointment customer details into Contacts through a staff-protected route.

Importing a customer into Contacts **does not establish marketing consent**.

### Campaigns

- Create campaigns for selected CRM contacts using a template.
- SMS, email, and combined channel options in the UI and send handler.
- Search and tag-filter contacts; select individuals or all filtered contacts.
- Preview a campaign before sending.
- Email-only sending was tested.
- SMS was tested in **mock mode**, not as a live Twilio production send.
- Campaign scheduling fields and a scheduler exist, but production scheduling, delivery reporting, consent, and opt-out behavior require further testing and safeguards.

Do not treat a campaign's `sent` status as proof every recipient received it. The current send flow needs improved per-recipient error handling.

### Analytics

- Booking counts and trends by scheduled date, service, and preparer.
- Contact-added and campaign-sent date-range summaries.
- SMS, email, template, and campaign-status summaries.
- Some timestamps and counts are approximations. Reschedule history and campaign-to-booking attribution are not recorded.

### Login and staff onboarding

- JWT-based CRM login with `staff` and `admin` roles.
- Public registration is disabled.
- Admin-only staff invitation form.
- One-time, expiring password-setup link sent to an invited email address.
- Invited users set their own password; accounts become active after setup.
- Login checks `active: true`.
- Staff invitation flow was tested end to end using a test email.
- A staff user was confirmed unable to access `/staff` directly.
- A staff request to `POST /api/admin/staff` returned **403 Admin access required**. The backend role check, not the hidden nav link, protects invitation creation.

## Project structure

```text
frontend/
  src/
    api/
    components/
    handlers/
    pages/
    styles/
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
```

The public DPS website and its booking backend are separate from this repository.

## Environment variables

Example CRM frontend development variables:

```env
VITE_API_URL=http://localhost:5002
VITE_DPS_API_URL=https://dps-final-tax-website.onrender.com
```

For the deployed CRM frontend, `VITE_API_URL` must point to the **deployed CRM backend**, not localhost. Check its current Render URL before setting this value.

The CRM backend needs its MongoDB connection, JWT secret, Resend configuration, CRM frontend URL, and DPS server-to-server connection configured in its backend environment. `DPS_STAFF_API_KEY` must match the value configured on the DPS backend.

**Never put backend credentials in a `VITE_` variable, a frontend `.env`, this README, screenshots, or Git.**

## Local development

1. Install dependencies separately in `backend/` and `frontend/`.
2. Configure local environment files without committing them.
3. Start the CRM backend and frontend separately.
4. Test login, the staff appointment proxy, and booking before making broader changes.
5. Run `npm run build` in `frontend/` before pushing.

The production frontend is deployed from GitHub to Render. A local change does not affect the live site until committed, pushed, and deployed.

## Security and operational limitations

1. **CRM route scoping:** Contact, campaign, message, and email endpoints still need consistent authentication and user/organization scoping. Some existing flows use a browser-supplied `userId: "user123"`. Do not treat this as production-safe multi-user isolation.
2. **Marketing consent:** Store separate SMS and email consent and opt-out state, and enforce it server-side before sending or scheduling campaigns. A booking or contact import is not marketing consent.
3. **Campaign accuracy:** Remove the ability to manually label a campaign `sent`. Track actual successes, failures, and skipped recipients; avoid duplicate sends on retry.
4. **Calendar-to-campaign flow:** Resolve selected appointment IDs to distinct CRM contacts, verify channel-specific consent, and create a draft before enabling personal or group campaign scheduling.
5. **Audit logs:** Record which authenticated staff user creates, edits, or cancels an appointment, with timestamps and appropriate before/after details.
6. **Booking hours:** Align the public form, customer manage page, staff calendar, and backend with approved tax-season and off-season hours.
7. **Secrets:** An earlier staff API key was exposed and rotated. Confirm old credentials are unusable and check Git history for exposed values. `.gitignore` does not erase Git history.
8. **Dependencies:** Review the high-severity npm audit finding. Test dependency fixes before deploying; do not apply breaking updates blindly.
9. **Private links:** Customer appointment-management URLs contain access tokens. Never put them in public logs, screenshots, or campaign templates.

## Next recommended work

1. Secure and scope CRM contact, campaign, message, and email routes for multiple staff users.
2. Add marketing consent and opt-out enforcement before production campaign sending.
3. Make campaign send results reliable, including per-recipient failures and retry protection.
4. Complete the calendar-to-campaign draft workflow; do not send directly from appointment selections.
5. Add staff audit logs.
6. Finalize seasonal booking hours across the DPS site and both backends.
7. Review production SMS/Twilio compliance before enabling real SMS.
````



```text
I am building DPS Textellent CRM, a separate React/Vite frontend and Express/MongoDB backend connected to the DPS website's Express/Supabase booking backend. The CRM and DPS site are deployed on Render.

Working and tested: admin/staff JWT login; admin-only staff invitation with expiring password-setup link; staff account setup and login; staff blocked from /staff and received backend 403 on POST /api/admin/staff; staff Booking calendar with create/edit/cancel, customer emails, and Add to Contacts; customer private Manage My Appointment page; Supabase no-overlap constraint; dashboard and analytics; email-only test campaign. SMS is currently mock mode.

Recent security work: DPS_STAFF_API_KEY was exposed and rotated in both backends. git ls-files frontend/.env returned no output, so that file is not tracked in the current commit. Do not paste or log new secrets or private manage links.

Current next priority: secure and scope CRM contact/campaign/message/email routes. Existing code sometimes trusts browser-supplied userId "user123". Then implement channel-specific marketing consent/opt-outs and reliable campaign results. Calendar Personal/Group Campaign buttons currently only navigate with appointment IDs; they do not select eligible contacts or send anything. Keep marketing consent separate from booking.

Relevant CRM files include frontend/src/App.jsx, components/AppLayout.jsx, components/Booking.jsx, pages/StaffManagementPage.jsx, pages/SetupPasswordPage.jsx, backend/controllers/authController.js, staffController.js, contactsController.js, backend/middleware/authMiddleware.js, backend/server.js, and backend/models/User.js. Preserve working routes and test one stage at a time.
```




The clearest new requirements from that review are:

- **CRM calendar:** Add **Day, Week, and Month** views. Day view should show each appointment’s client name and time; clicking a day in Month view should open its daily schedule. Keep this staff-only.
- **Appointment length:** Staff want short visits as well as 30 minutes and 1 hour. Confirm the exact options before coding; the discussion mentions **10, 15, 30, 45, and 60 minutes**. The public customer form can keep different options if that is what the office wants.
- **Visit format:** Add a required choice to both DPS booking and CRM staff booking: **In person, Over the phone, or Virtual/online**. Show the saved choice in the CRM and customer emails. Confirm whether phone and virtual are separate options before naming them.

The mortgage/property discussion does not establish a clear website change, so don’t add rates, down-payment claims, or property values from it.

**Start with visit format:** agree on the three labels, then add a database field and backend validation before changing either booking form. After that, build Day and Week views using the appointments the CRM already loads.