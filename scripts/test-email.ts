#!/usr/bin/env bun
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("Error: RESEND_API_KEY is not set");
  process.exit(1);
}

const from =
  process.env.RESEND_FROM ?? "Catopia <noreply@catopia.chenantunez.com>";
const prefix = process.env.RESEND_SUBJECT_PREFIX ?? "[CLIENT INQUIRY]";
const to = process.env.RESEND_TO ?? "catopia@chenantunez.com";

const resend = new Resend(apiKey);
const toSend = {
  from,
  to,
  replyTo: "test-client@example.com",
  subject: `${prefix} [Test] Contact form email`,
  text: "Name: Test User\nEmail: test-client@example.com\n\nThis is a test message from scripts/test-email.ts.",
};
console.log("Sending: ", toSend);

const { data, error } = await resend.emails.send(toSend);

if (error) {
  console.error("Failed to send test email:", error);
  process.exit(1);
}

console.log("Test email sent successfully:", data);
