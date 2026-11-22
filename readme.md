# DPS Textellent CRM

A staff-facing CRM and outreach platform for DPS Professional Tax Services. Manages contacts, SMS/email conversations, templates, campaigns, analytics, appointments, and more.

**Live:** https://www.dps-crm.com

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, React Bootstrap, React Icons, Recharts, CSS |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT |
| Email | Resend |
| AI | Groq (LLM) |
| Hosting | Render |

## Applications & URLs

- Public DPS website: https://www.dpstaxpro.com
- DPS booking API: https://dps-final-tax-website.onrender.com
- CRM frontend: https://www.dps-crm.com
- CRM backend: https://dps-crm-1.onrender.com

## Features

### Dashboard
- Contact, message, template, campaign, and email counts
- Today's appointments and this week's bookings
- New client signups alert (last 7 days)
- AI Follow-Up Suggestions (AI analyzes contacts, suggests actions)
- AI Revenue Insights (trends, busy periods, top services, recommendations)
- Front-page booking messages (with delete + bulk select)
- Quick Actions dropdown

### Contacts
- Add/edit/delete contacts; dedicated Add Contact page
- Textellent-style table view (columns, search, filter, bulk select)
- Filter by status (Active/Inactive/Recent), tags, and contact lists
- Import contacts from CSV (phone column required)
- Custom fields (key/value pairs)
- Contact lists (group contacts, filter by list)
- AI Search (natural language), AI Summary (save to notes), Suggest Tags
- Send SMS/Email, book appointments, send account-link invitations
- Conversation history, documents, AI smart replies
- Notes with suggested note chips

### Templates
- Create/edit/delete templates with placeholders ({{firstName}}, {{lastName}}, {{fullName}}, {{companyName}}, {{companyPhone}}, {{companyEmail}}, {{companyAddress}}, {{companyWebsite}})
- AI Generate Template from a goal
- Company info (DPS) reference panel
- Action buttons: Use for Campaign, Send as SMS, Send as Email, Booking Reminder, Edit, Delete

### Text Blasts (Campaigns)
- Create SMS/email/both campaigns to selected contacts
- AI Generate Copy from a goal + audience + tone
- Edit campaign (name, type, status, subject, template, body, scheduled time)
- Schedule campaigns; delete campaigns
- Search and filter (All/Active/Inactive/Recent)
- Recurring Campaigns + View Templates links

### Emails
- View and send individual emails to contacts
- AI Generate Email (subject + body from goal)
- AI Suggest Replies based on email history
- AI Summary of contact's email thread (save to notes)
- Templates support; delete emails/conversations

### Media Library
- Upload images/PDFs (max 5MB)
- Grid view with image previews
- Search by name/filename
- Delete files; reference by URL

### Drip Campaigns
- Multi-step timed email sequences
- Each step: delay (days), subject, body; placeholders supported
- AI Generate per step + template selector
- Load sample drip (3-step welcome series)
- Enroll contacts; background scheduler sends emails automatically
- View/delete campaigns

### Automations
- Out-of-Office Responder (date range + SMS/Email messages)
- After-Hours Responder (time window + SMS/Email messages)
- Birthday Greeting (daily at 9 AM ET, SMS/Email)
- Channels: SMS only, Email only, or SMS + Email

### Analytics (Reports)
- Tabs: Dashboard, Messages, Text Blast, Automations, Auto Responders
- KPIs: Booked, Confirmed, Cancelled, Contacts, Campaigns, SMS, Emails, Templates
- Charts: appointments by date, by service, by preparer, SMS/email activity
- Date range filter (7/30/90 days)
- AI Revenue Insights with priority + recommendations

### Booking
- Full calendar (Day/Week/Month views)
- Create/edit/cancel appointments (tax + realty)
- AI Schedule (natural language → auto-fill + auto-book)
- Find existing contact + auto-fill client details
- Block out time (lunch, meetings)
- 15-min slot increments, dynamic office hours
- Notes field with suggested note chips
- Color-coded by preparer; real estate in teal

### Staff Management (Admin)
- Invite staff (email + one-time setup link, 24h expiry)
- Deactivate/reactivate accounts; cannot deactivate self
- Role-based access (admin/staff)

### Help
- Comprehensive guides for every CRM feature (icons + cards)

### Settings
- Account and app settings, theme toggle

### Onboarding Tour
- Each page has a guided tour; click ? button anytime

### AI Chat (DPS CRM Assistant)
- Ask anything about the CRM; knows all features

## Tech Stack Details

- **Frontend:** React, Vite, React Router, React Bootstrap, React Icons, Recharts
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, CORS
- **Email:** Resend
- **AI:** Groq (LLM)
- **Hosting:** Render (static site + web service)











