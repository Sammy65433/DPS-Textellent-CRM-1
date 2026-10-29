Right now, the CRM calendar **only shows open slots and lets someone create a booking**. A booking made on the DPS site is saved in Supabase and affects availability, but this page does not yet display the appointment or let its customer change it.

You need two separate views:

- **Staff CRM calendar:** Fetch DPS appointments from the backend and display bookings on their dates. Protect that endpoint with staff authentication because it contains customer names and contact details.
- **Customer “Manage My Appointment” page on the DPS site:** Put a private, expiring link in the customer’s booking email. That link should let the customer see **only their appointment**, choose a new available date and time, or cancel it. The backend must verify the link and recheck availability before saving changes.

**Do not give customers CRM logins or show all appointment on a public calendar.** Your current `/booking` page can stay staff-only; customers use their private link on the DPS site. Also, the current email’s Reschedule button only opens the general booking form, so it does not change their existing appointment.



Build these as **two separate features**. Start with the staff calendar, but secure its API before displaying customer details.

1. **DPS backend:** Protect `GET /api/appointments` with staff authentication. The CRM’s `ProtectedRoute` protects the page, **not** the DPS API. The DPS backend must verify a staff credential on every request. Do not use a secret in `VITE_` variables.
2. **CRM `Booking.jsx`:** Fetch appointments from that protected endpoint. Group them by `appointment_date`, show a count on each calendar day, and list the selected day’s bookings beneath the calendar. Do not put customer names in publicly accessible availability responses.
3. **Customer management:** Create a separate DPS site route such as `/manage-appointment?token=...`. Generate a random, expiring, single-appointment token on the backend and email its link to the customer. The backend must validate it before returning that appointment, rescheduling it, or cancelling it. Rescheduling must perform the same overlap check as a new booking.

**Do not add a customer-facing link to `/admin` or the CRM.** First share the CRM login/auth middleware and the DPS `appointmentRoutes.js` files so the staff endpoint can be wired to your actual authentication without exposing appointments.

















Start by checking how the **CRM backend verifies logins**. Its `localStorage` token cannot safely be trusted by the DPS backend unless both backends verify it the same way.

Open these files and share their code, with passwords, keys, and secrets removed:

- CRM backend login route/controller
- CRM backend authentication middleware
- DPS backend `routes/appointmentRoutes.js`

Then we can protect **only** `GET /api/appointments` with server-side staff verification and update the CRM calendar to send its login token. Leave the public availability and booking routes accessible so DPS customers can still book. Do not add a shared secret to `VITE_` or expose appointment data while wiring this up.























Save this as a **local handoff document**, such as `PROJECT-HANDOFF.md`. It covers both repositories and distinguishes tested behavior from recent work that has **not been pushed or verified in production**. Keep the resume prompt after the document for your next Cluely session.

```md
# DPS Website and Textellent CRM: Project Handoff

**Developer:** Samuel Jacquet  
**Purpose:** Record what the two applications do, what has been tested, what changed recently, and exactly where development should resume.

**Status note:** This document combines previously tested features with recent local changes. Recent CRM account-linking code has **not been pushed or verified end to end**. Do not describe it as a live feature or use it to access real client tax documents.

## 1. The two applications

This project consists of two separate applications with different users and databases.

| Application | Intended user | Frontend | Backend | Main data |
| --- | --- | --- | --- | --- |
| DPS Professional Tax Services website | Clients and website visitors | React/Vite | Express | Supabase appointments, customer identities, and prototype document metadata/storage |
| DPS Textellent CRM | DPS staff and administrators | React/Vite | Express | MongoDB contacts, staff users, conversations, templates, and campaigns |

The public website lets clients learn about DPS, request appointments, contact the office, and sign in to a developing customer portal. The CRM lets authenticated staff manage contacts, communications, campaigns, and appointments.

**A customer account is not a CRM staff account.** Customer login uses Supabase Auth. CRM staff login uses a MongoDB user record, bcrypt password hash, and CRM-issued JWT.

### Application URLs

| Service | URL |
| --- | --- |
| Public DPS website | `https://www.dpstaxpro.com` |
| DPS backend | `https://dps-final-tax-website.onrender.com` |
| CRM frontend | `https://dps-textellent-frontend.onrender.com` |
| CRM backend | `https://dps-crm-1.onrender.com`, as shown in the Render logs; verify before changing configuration |

Local development commonly uses DPS backend port `5001` and CRM backend port `5002`. Either Vite frontend may start on `5173` or `5174` if a port is already occupied. **Use the URL printed by the relevant frontend terminal.**

### System boundaries

```text
Public visitor/customer
    |
    v
DPS React website
    |
    v
DPS Express API
    |
    +-- Supabase appointments
    +-- Supabase Auth customer verification
    +-- Private Supabase Storage prototype
    +-- Resend appointment/contact emails

CRM staff member
    |
    v
CRM React frontend
    |
    v
CRM Express API
    |
    +-- MongoDB staff, contacts, communications, campaigns
    +-- Server-to-server DPS appointment API requests
```

The CRM frontend must not call staff-protected DPS endpoints with a secret. Server-to-server credentials belong in the **two backends only**.

## 2. DPS website: public-facing work

The DPS website presents tax preparation and related business services through a responsive React application. Its interface has been revised around teal and purple branding, glass-style cards, photography, and dedicated pages.

### Public pages and navigation

The site includes:

- Homepage with a hero, service previews, resources, client-feedback preview, contact form, and real estate preview
- About, Purpose, and Moments pages
- Tax Preparation, Notary, Form Preparation Support, Copy & Fax, Business Services, and Other Services pages
- Pricing and payment information
- What to Bring & FAQ
- Official Taxpayer Resources
- Contact and real estate booking pages

The header groups related pages into dropdowns. The hero includes quick links to Services, Resources, booking, and calling the office. The logo/name and Home link were updated to scroll to the top when clicked from the bottom of the homepage.

The homepage hero and Contact section also have photo slideshows. These are presentation features, not document-management features.

### Tax appointment booking

The public booking form sends requests to the DPS backend. Clients choose a service, preparer, date, time, and meeting format. The frontend fetches available times; the backend checks conflicts before saving an appointment in Supabase.

The backend also supports staff booking, appointment updates, cancellations, and customer rescheduling. Its `appointments_no_overlap` database constraint protects against overlapping active appointments for one preparer.

The booking page warns clients **not** to put Social Security numbers, banking details, or tax documents in the public form.

### Customer appointment management

Appointment emails can include a private, expiring **Manage My Appointment** link. This is separate from CRM login and from the new customer portal. The link is intended to show only the associated appointment and allow permitted changes or cancellation.

Treat these links as credentials. Do not put them in screenshots, analytics events, public logs, or campaign templates.

### Contact form

The public Contact form submits to `POST /api/contact`. The DPS backend validates its fields and sends office notifications through Resend. This flow was previously tested on the deployed site. The form includes a honeypot and warns against submitting sensitive tax data.

### Realty requests

The real estate page introduces the independent RC Realty Group partner and includes a real estate request form. DPS is not presented as the brokerage.

### Existing secure portal

The website links to the existing **CCH iFirm** portal for real client tax documents. A DPS website login does **not** automatically sign a customer into CCH iFirm.

CCH iFirm must remain the live option for sensitive uploads while the new DPS document prototype lacks full production controls.

## 3. DPS customer portal and document prototype

Customer authentication was added using Supabase Auth.

### Customer sign-in: tested

- A test Supabase customer was created.
- The DPS frontend signed in with Supabase Auth.
- The DPS backend's `requireCustomer` middleware verified the bearer token through Supabase.
- `GET /api/customer/me` returned only the signed-in customer's ID and email.
- Portal refresh preserved the session.
- Sign-out worked.
- Direct navigation to `/client-portal` while signed out redirected to `/client-login`.

The DPS frontend uses the Supabase **publishable key**. Backend secret/service keys must never be placed in a `VITE_` variable.

### Private document prototype: tested with dummy files

A private Supabase Storage bucket named `customer-documents` was created with:

- Public access off
- A 5 MB file-size restriction
- PDF, JPEG, and PNG MIME types

A `customer_documents` metadata table was created with row-level security enabled. The DPS backend uses authenticated customer routes to upload and list files. Storage paths are assigned by the backend under the verified customer's ID; the browser does not choose another customer's folder.

Tests completed:

- A signed-in test customer uploaded a **non-sensitive dummy file**.
- Its name appeared in that customer's portal list after upload.
- The file appeared in the private bucket.
- A second test customer could not see the first customer's document list.

**What this does not prove:** production-safe downloads, malware scanning, comprehensive authorization testing, retention/deletion rules, access audit logs, or staff CRM access. Only dummy files should be used in this prototype.

Relevant DPS files include:

```text
Backend/app.js
Backend/middleware/requireCustomer.js
Backend/routes/customerRoutes.js
Backend/routes/customerDocumentRoutes.js
Frontend/src/lib/supabase.js
Frontend/src/pages/ClientLogin.jsx
Frontend/src/pages/ClientPortal.jsx
Frontend/src/pages/ClientLink.jsx
Frontend/src/components/CustomerDocuments.jsx
```

### Customer-to-CRM linking: in progress, not verified

The desired flow is:

```text
CRM staff selects a contact and requests an invitation
    |
    v
CRM backend sends a one-time link to that contact's email
    |
    v
Customer opens /client-link on the DPS website
    |
    v
Customer signs in to their Supabase account and confirms
    |
    v
DPS backend verifies the customer token
    |
    v
DPS backend calls the CRM backend with a server-only credential
    |
    v
CRM backend validates and consumes the invitation
    |
    v
CRM Contact.supabaseCustomerId is set
```

Possession of the link **alone** must not link an arbitrary Supabase account. The flow was revised to require both the emailed invitation and a signed-in, email-confirmed customer account whose email matches the invitation recipient.

The DPS `/client-link` page and login return path were added. A navigation-only test used `token=TESTONLY`, which is intentionally invalid. **No successful real invitation redemption has been demonstrated.**

The DPS backend has a customer-authenticated `/api/customer/link` forwarding route in local work. It derives the customer ID and email from the verified Supabase user, not from browser-submitted identity fields. Its server-to-server request goes to the CRM redemption route using `CRM_LINK_REDEEM_KEY`.

Do not claim the two systems are linked until a fresh dummy invitation has completed the entire flow and the resulting CRM contact record has been checked.

## 4. CRM: existing staff features

The CRM is a separate, staff-facing React/Vite and Express/MongoDB application.

Its existing capabilities include:

- Staff dashboard and booking calendar
- CRM contacts with search, tags, notes, edit, and delete controls
- Individual SMS and email conversations
- Templates and campaigns
- Analytics
- Staff/admin login and admin-only invitations

**SMS has been tested in mock mode; do not describe it as verified production Twilio delivery.** Email-only campaign testing was performed, but consent, per-recipient outcomes, retries, opt-outs, and scheduling still need work.

### CRM authentication

CRM users are stored in MongoDB, with bcrypt-hashed passwords and JWT sessions. Staff and admin roles are distinct. Public staff registration is disabled; the existing staff invitation flow uses an expiring password-setup email.

`requireAuth` was updated to check that a staff account still has `active: true` on authenticated requests. `requireStaff` and `requireAdmin` provide role checks on applicable routes.

**Password incident:** During local work, CRM sign-in failed. A local check found the staff account existed and was active, but the attempted password did not match its stored bcrypt hash. The developer subsequently recovered access with the correct CRM password. This was distinct from the DPS customer's Supabase password. Do not repeat the temporary password-check/reset workflow or change passwords merely to address DPS appointment API errors.

### CRM appointment connection

The CRM backend requests appointments from the DPS backend using the server-only `DPS_STAFF_API_KEY`. The frontend uses its CRM staff JWT to call the CRM backend; it must never contain the DPS staff key.

Staff booking, appointment display, Add to Contacts, and customer email behavior were previously exercised. At one point CRM-to-DPS appointment requests returned upstream `401`; later local logs showed upstream `200`. **The latest reported state again showed `DPS appointments upstream status: 401` while CRM staff login worked.** Treat that as a separate environment/key mismatch until checked on the exact local or deployed pair of backends being tested. Do not interpret it as a CRM password failure.

The CRM calendar's Personal/Group Campaign actions are not a completed send workflow. Appointment import into Contacts does **not** create marketing consent.

## 5. CRM contact security work

### MongoDB Contact model

The CRM `Contact` model now includes a nullable `supabaseCustomerId` field with `select: false`. It is intended to be populated **only** through the verified account-linking flow, not through ordinary contact create/edit requests.

A **partial unique index** on `supabaseCustomerId` was checked in MongoDB Compass and shown as **UNIQUE** and **PARTIAL**. This permits multiple unlinked contacts while preventing the same non-null Supabase customer ID from appearing on more than one contact.

Existing test contacts remain unlinked where `supabaseCustomerId` is `null`. Matching a contact's email to a Supabase account is **not sufficient** to link them.

### Contact CRUD routes

CRM contact routes were updated to apply `requireAuth` and `requireStaff`. The contact controller allowlists editable fields rather than spreading `req.body` into MongoDB. It uses the existing `"user123"` contact partition internally so existing contacts remain visible while browser-supplied `userId` is no longer trusted for contact CRUD.

The CRM frontend Contacts API functions were changed to send the CRM staff JWT from its existing `localStorage` key, `token`. These changes apply to **Contacts**; messages, emails, templates, and campaigns still need their own authentication and scoping review. `"user123"` is a temporary shared partition, **not** production-grade organization isolation.

### CRM account-linking files

Recent work added or updated:

```text
backend/models/Contact.js
backend/models/ContactLink.js
backend/routes/contactLinkRoutes.js
backend/routes/internalContactLinkRoutes.js
backend/server.js
```

The staff invitation route is mounted under `/api/contact-links` and requires CRM `requireAuth` and `requireStaff`. It creates a random token, stores its hash with an expiry and the invitation recipient's email, and uses Resend to email a DPS `/client-link` URL.

The internal redemption route is mounted under `/api/internal/contact-links`. It verifies a server-only `CRM_LINK_REDEEM_KEY`. Recent code uses a MongoDB transaction to consume an unused, unexpired invitation and set `Contact.supabaseCustomerId`, while checking the invited email, the signed-in customer's verified email, and duplicate links.

**Important:** Seeing route code and a unique index does not mean the complete link has been tested. Invitation sending, return from Supabase sign-in, DPS forwarding, CRM transaction, reuse rejection, wrong-email rejection, expiry, and CRM record results still need an end-to-end dummy-account test.

The invitation token and complete invitation URL must not appear in public logs or screenshots.

## 6. Current deployment and local-work boundary

Both applications have been deployed on Render in earlier stages. **Recent code changes have not all been pushed.** A working local route is not proof that production has that route, and a live login result does not prove an unpushed local backend change works.

The most recent local development involved CRM account linking and troubleshooting local CRM login. The CRM frontend shown in local testing was at a Vite URL such as `localhost:5174`; the CRM API was on `localhost:5002`. The DPS API was on `localhost:5001`. Check actual terminal output for frontend ports.

A local `.env` and a Render service's environment settings are independent. Updating one does not update the other. Vite environment changes require a frontend restart locally or a rebuild for deployment.

Before claiming a feature is live, confirm which repository, branch, commit, and Render service contain it.

## 7. Configuration boundaries

### DPS frontend

Public browser configuration includes its DPS API URL, Supabase project URL, and Supabase publishable key. Supabase secret/service keys do not belong here.

### DPS backend

Uses server-only configuration for Supabase, email, private Storage operations, staff API checks, and the DPS-to-CRM account-link forwarding request.

### CRM frontend

`VITE_API_URL` must point to the **CRM backend**, not the DPS backend. When it mistakenly pointed to the DPS API, CRM `/api/auth/login`, contacts, templates, and campaign calls returned HTML/404 responses. This caused an `Unexpected token '<'` JSON parsing error.

A CRM frontend may have a separate DPS public API URL for intended public calls, but it must never contain `DPS_STAFF_API_KEY` or `CRM_LINK_REDEEM_KEY`.

### CRM backend

Uses MongoDB and JWT configuration, Resend for appropriate email flows, `DPS_API_URL` and `DPS_STAFF_API_KEY` for CRM-to-DPS staff requests, and the server-only redemption key for DPS-to-CRM linking.

**Do not put actual environment values, credentials, invitation tokens, JWTs, MongoDB URIs, or private document URLs in this handoff.** Credentials were exposed during earlier troubleshooting. Rotate affected values, confirm old values no longer work, and review Git history if any were ever committed. `.gitignore` prevents new tracking but does not remove past commits.

## 8. Known security and product limitations

1. **Real tax documents:** Continue using CCH iFirm. The new DPS upload/list flow is a dummy-file prototype.
2. **CRM document visibility:** Not implemented. There is no completed staff Documents panel or verified read-only metadata proxy.
3. **Account linking:** Code is present locally, but end-to-end redemption has not been verified.
4. **CRM route scoping:** Messages, email, templates, and campaigns still require a consistent backend auth and data-scoping review.
5. **Frontend admin password:** A `VITE_ADMIN_PASSWORD`, if still used by the DPS admin page, is browser-visible and is not production-grade authorization.
6. **File safety:** Malware scanning, secure customer/staff download controls, access audit logs, and retention/deletion policy are missing.
7. **Marketing consent:** Appointment booking or CRM contact import does not authorize SMS/email marketing.
8. **Campaign results:** A campaign marked `sent` does not prove delivery to every recipient.
9. **Dependency vulnerabilities:** Backend and frontend npm audit reports included high/critical findings. Review specific packages and test fixes rather than applying breaking changes blindly.
10. **Business content:** Confirm office hours, advertised services, pricing, published tax dates, and permission to use testimonials and photos.
11. **Private URLs:** Appointment-management and invitation tokens are credentials; avoid logging query strings containing them.

## 9. Exact point where work stopped

**Last confirmed:**

- DPS customer sign-in and dummy document upload/list worked.
- A second DPS customer did not see the first customer's listed dummy document.
- CRM staff sign-in access was recovered.
- CRM `contacts` collection showed the partial unique index for `supabaseCustomerId`.
- CRM account-link invitation and transactional redemption code were added locally.
- A dummy CRM contact with `supabaseCustomerId: null` was identified.
- No successful end-to-end customer-to-CRM account link was confirmed.
- CRM does not yet show customer documents.
- Latest reported CRM-to-DPS appointment upstream status was `401` in a local CRM backend terminal, independent of staff login.
- Recent changes were reported as not yet pushed; verify Git status before deployment.

**Immediate next task:** stabilize the exact **local** CRM-to-DPS appointment connection without touching staff passwords. Then perform one local, dummy-account invitation and redemption test after confirming both backends point to one another correctly.

A practical order:

1. Check which local servers are running and which backend URLs each uses. Keep login and appointment upstream failures separate.
2. Confirm local CRM staff login still works.
3. Confirm CRM appointment proxy works against the intended DPS backend. Resolve any `401` using backend-only staff-key configuration; do not modify frontend credentials.
4. Confirm both account-link backends have matching server-only redemption credentials and intended local URLs. Do not expose their values.
5. Send a **fresh invitation only to a dummy contact/email you control**, using an authenticated CRM staff request.
6. Sign in on the DPS site using the corresponding, email-confirmed dummy Supabase customer and explicitly confirm.
7. Verify that the intended CRM contact receives `supabaseCustomerId`, the invitation cannot be reused, and a second customer cannot claim it.
8. Add a staff-only, metadata-only CRM document view **after** identity linking is proven. Downloads and real documents remain out of scope until further protections are added.
9. Run builds and targeted tests; review Git changes and deploy the repositories separately.

## 10. Non-goals for the immediate next session

- Do not reset CRM staff passwords to fix DPS appointment API errors.
- Do not send real customer invitations.
- Do not upload real tax documents to the prototype.
- Do not expose server keys or customer IDs as authorization shortcuts in React.
- Do not auto-link contacts to Supabase accounts by email alone.
- Do not claim a local implementation is live until its commit and deployment are verified.
```


```


# DPS Website and Textellent CRM: Work Handoff

**Developer:** Samuel Jacquet  
**Applications:** DPS public website and DPS Textellent staff CRM  
**Status:** Local work and selected local tests are described below. Do not assume a change is pushed or deployed without checking each repository and its Render service separately.

## 1. System boundaries

| Application | Users | Frontend | Backend | Data |
| --- | --- | --- | --- | --- |
| DPS website | Visitors and customers | React/Vite | Express | Supabase Auth, appointments, private document Storage and metadata |
| Textellent CRM | DPS staff | React/Vite | Express | MongoDB staff users, contacts, account links, communications, campaigns and download audit records |

Customer sign-in uses **Supabase Auth**. Staff sign-in uses a **CRM-issued JWT** backed by a MongoDB staff account. They are not interchangeable.

Typical local backend ports are DPS `5001` and CRM `5002`. Vite frontend ports vary. Use the URLs printed by the respective terminals.

## 2. What was verified locally

- A DPS customer could book an appointment. The appointment appeared on the CRM staff calendar, and a booking email arrived.
- An appointment-management email link opened the customer management flow. The meeting-format field and readable date format were added in local code; do not assume they are on the deployed site.
- Customer signup and sign-in through Supabase were exercised. Supabase email confirmation and CRM account-link invitation emails were received during testing.
- At least one dummy customer-to-CRM contact invitation was redeemed, with `supabaseCustomerId` populated on the intended MongoDB contact. A reused invitation reported invalid or expired.
- A DPS client portal upload appeared in that customer's portal.
- For a linked contact, CRM staff saw a document and successfully downloaded it locally.
- A successful staff download produced a MongoDB `documentaccesslogs` record with `outcome: "allowed"` and `statusCode: 200`.
- CRM individual email sending was exercised: the email arrived and appeared in CRM history.
- Contacts and templates remained visible after their authentication changes.

**Limits of those tests:** They do not prove all contacts are linked, all files are accessible, every access-denial case works, malware scanning exists, or Render has deployed the local changes. A separate contact with `supabaseCustomerId: null` could not show the uploading customer's files. Do not copy another contact's customer ID into it.

## 3. DPS appointment work

The public booking flow remains available to visitors. The CRM staff calendar retrieves appointment details through its authenticated CRM backend, which calls DPS using a backend-only staff key.

Local `ManageAppointment.jsx` changes include:

- Displaying meeting format and allowing customers to choose `in_person`, `phone`, or `virtual` when changing an active appointment.
- Sending `visit_format` in the reschedule request.
- Disabling past dates and Sundays in the visible calendar.
- Formatting the appointment details date as **October 29, 2026** rather than displaying the raw database date.

The DPS `manageAppointmentController.js` was changed to return, validate and save `visit_format`. It retains availability checks and the database overlap protection. The frontend should keep `YYYY-MM-DD` for API requests and format the date **only for display**.

The live management page was observed without the new meeting-format select at one point. Verify the exact DPS frontend and backend deployments before claiming that feature is live.

## 4. Customer login and account linking

The DPS site has separate client pages for login, signup, portal access and invitation confirmation. A distinct **Log In** header button leads to a choice page:

- **Client Access** opens DPS customer login.
- **Staff Access** opens the separate CRM login.

The invitation flow requires a signed-in, email-confirmed Supabase customer whose email matches the invitation recipient. Its token is one-time and expires. Signing in, signing up, booking or uploading **does not automatically link** an account to a CRM contact.

Local DPS frontend changes to `ClientLink.jsx`, `ClientLogin.jsx` and `ClientSignup.jsx` were provided to preserve the invitation return destination through signup and Supabase email confirmation. The existing CRM internal redemption route retains its duplicate-link and one-time-use checks. Verify the saved versions and deployment before relying on that return flow.

For local invitations, the CRM backend's `DPS_FRONTEND_URL` must point to the **DPS Vite frontend**, not the CRM frontend. In Render it must point to the deployed DPS website. Do not share invitation tokens or URLs.

## 5. Customer-to-staff documents

The DPS customer portal uploads to a private Supabase Storage bucket and stores metadata under the authenticated customer's ID. CRM document listing and downloading go through:

1. CRM staff JWT verification.
2. A selected CRM contact's stored `supabaseCustomerId`.
3. A CRM-backend-to-DPS-backend request using a server-only staff key.
4. A DPS metadata lookup that matches both customer ID and document ID before a private Storage download.

The CRM download route writes a staff access audit record and blocks a successful download if the audit write fails.

A `scan_status` column was added to `customer_documents`, defaulting to `pending`. **No malware scanner was connected.** During local work, DPS staff-route filters for `scan_status = "clean"` were added, then removal of those filters was discussed to restore non-sensitive-file downloads. Confirm which version is actually **saved locally, committed and deployed**. Do not claim files are scanned.

The DPS portal should consistently say:

> Upload non-sensitive files only. Files are not malware-scanned. Do not upload tax returns, IDs, Social Security numbers, banking records or other confidential information. Use CCH iFirm for sensitive documents.

An upload success message must not promise staff access unless the contact is linked and the running staff route actually permits the file. **CCH iFirm remains the workflow for sensitive documents.**

Staff document deletion was discussed but **not implemented**. There is no verified staff Delete endpoint or confirmation flow. Downloaded copies on staff devices would not be removed by deleting a Storage object.

## 6. CRM Contacts, Emails and Booking UI

- CRM Contacts has a staff-only **Send account-link invitation** action for a selected contact.
- The CRM Emails page was given a complete JSX replacement to show the selected contact's document panel, Download action, Book Appointment button and invitation button while retaining email history and the composer. Confirm it was saved and deployed before describing it as live.
- The CRM `Booking.jsx` received incremental instructions to show **Send Account-Link Invitation** only after **Add to Contacts** returns a specific CRM contact. Its `appointmentContacts` state is in memory, so that button disappears on reload until Add to Contacts is used again.
- Importing an appointment into Contacts does **not** establish marketing consent and does **not** link the customer to a Supabase account.
- Separate contacts, even with similar names or shared contact details, must not inherit each other's document access.

## 7. CRM route-security work and open issues

Contact CRUD, individual emails, templates and message staff routes were changed locally to use CRM authentication and a server-derived legacy DPS scope, `user123`. Frontend API calls for those routes were updated to send the CRM staff JWT. The message controller no longer relies on a browser-supplied `userId` in the supplied replacement. SMS remains mock-only; the inbound Twilio webhook is not configured with provider signature verification.

Campaign work needs reconciliation before deployment:

- The campaign routes were given staff authentication.
- A supplied replacement campaign controller disables manual sending pending recipient-consent handling.
- A supplied replacement scheduler disables automatic sending.
- Samuel wants automatic scheduling in the eventual product. **Do not assume the controller, scheduler and frontend are currently consistent, and do not deploy a combination that sends without consent or retries a throwing send function every minute.**
- Check the exact saved files before changing or deploying campaigns.

`user123` remains a shared **DPS-only legacy partition**, not organization isolation. This CRM is currently intended for DPS staff, not multiple businesses. Do not use a browser-supplied `userId` as authorization.

The `DocumentAccessLog` model and route should also be reconciled: the route tries to log malformed contact IDs with no `contactId`, while one shown model version still requires that field. This bug does not explain a contact's empty document panel.

## 8. Current deployment and configuration boundary

Do **not** copy local `.env` files to Render. Local backend-to-backend URLs use `http://localhost:5001` and `http://localhost:5002`; production must use the respective deployed backend URLs. CRM frontend `VITE_API_URL` must target the **CRM backend**, never DPS port `5001`. Server keys must never go into `VITE_` settings.

The DPS and CRM repositories must be reviewed, committed and deployed separately. A local working feature, a pushed commit and a completed Render deployment are three different states. Earlier Git checks found uncommitted account-link work in both repositories; today's final Git status and deployed commits have **not** been established in this handoff.

Never commit `.env` files, password-reset scripts, JWTs, invitation URLs, appointment-management tokens or private document URLs. Previous screenshots exposed private links; treat those links as credentials.

## 9. Targeted checks before broader release

1. Review `git status` and the diff in **each repository separately**. Identify exactly which versions of the DPS staff document route, portal disclaimer, CRM campaign controller and scheduler were saved.
2. Build both frontends and start both backends from their intended configuration. Fix build/runtime failures before committing.
3. On DPS, verify public booking, available times, customer sign-in/signup, appointment-management changes and the displayed meeting format. Do not use a real customer's appointment to test rescheduling.
4. On CRM, verify staff login, calendar appointments, Contacts, Templates and individual email without relying on browser-supplied `userId`.
5. With non-sensitive test files, verify the linked contact sees only its customer's documents, an unlinked contact is denied, staff download works and its audit record is written. Verify the portal disclaimer matches the **actual** scan behavior.
6. Reconcile campaign consent and scheduler behavior before deploying campaign changes. Do not send a campaign as a deployment smoke test.
7. Review file retention/deletion, malware risk, staff-device handling and access logs before expanding document use. Real tax documents remain in CCH iFirm.
8. Commit and deploy the DPS and CRM changes separately. Check the resulting Render commits and production environment settings without disclosing values.

## 10. Where to resume

First establish the exact **saved, committed and deployed state** of both repositories, particularly the document scan filter and campaign files. Then resolve only the differences that block the intended non-sensitive-file workflow. Do not reopen the already working customer upload or staff download code without a specific failure.
