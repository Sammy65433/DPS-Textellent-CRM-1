import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const isMock = process.env.MOCK_SMS === "true";

let client = null;
if (!isMock) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

export const sendSms = async (to, body) => {
  if (isMock) {
    console.log("MOCK SMS sent:", { to, body });

    return {
      sid: `mock-${Date.now()}`,
      status: "sent",
    };
  }

  return await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};
