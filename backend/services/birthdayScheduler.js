import Contact from "../models/Contact.js";
import { Resend } from "resend";

const DPS_SCOPE = "user123";

export async function runBirthdayTick() {
  if (!process.env.RESEND_API_KEY) return { sent: 0, reason: "no api key" };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();
  const etDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(now); // YYYY-MM-DD
  const [year, month, day] = etDate.split("-").map(Number);

  const contacts = await Contact.find({
    userId: DPS_SCOPE,
    birthday: { $ne: null },
    email: { $ne: "" },
  });

  let sent = 0;
  for (const contact of contacts) {
    const b = contact.birthday;
    if (!b) continue;
    if (b.getUTCMonth() + 1 !== month || b.getUTCDate() !== day) continue;
    if (contact.lastBirthdaySentDate === etDate) continue;

    const name = contact.firstName || contact.name || "friend";
    try {
      await resend.emails.send({
        from: "DPS CRM <appointments@dpstaxpro.com>",
        to: contact.email,
        subject: `Happy Birthday, ${name}! 🎂`,
        text: `Happy Birthday, ${name}!\n\nWishing you a wonderful day and a great year ahead. Thank you for being part of the DPS Professional Tax Services family.\n\nIf there's anything we can help you with this year — taxes, notary, real estate, or anything else — just reply to this email or call (973) 327-2340.\n\nWarmly,\nDPS Professional Tax Services\n1811 Springfield Ave, Maplewood, NJ 07040`,
      });

      contact.lastBirthdaySentDate = etDate;
      await contact.save();
      sent += 1;
      console.log("Birthday email sent to", contact.email);
    } catch (emailError) {
      console.error("Birthday email failed for", contact.email, emailError);
    }
  }

  return { sent, date: etDate };
}

export const startBirthdayScheduler = () => {
  if (!process.env.RESEND_API_KEY) {
    console.log("Birthday scheduler disabled: RESEND_API_KEY missing.");
    return;
  }

  const tick = async () => {
    try {
      const now = new Date();
      const etHour = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          hour12: false,
        }).format(now)
      );
      // Only send once per day, around 9 AM ET.
      if (etHour !== 9) return;
      await runBirthdayTick();
    } catch (error) {
      console.error("Birthday scheduler error:", error.message);
    }
  };

  // Run once on startup (in case the server started at 9 AM) and then hourly.
  tick();
  setInterval(tick, 60 * 60 * 1000);
  console.log("Birthday scheduler started.");
};