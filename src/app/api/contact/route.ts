import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const e = env as Record<string, string>;

  const apiKey = e.RESEND_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 },
    );

  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { name, email, subject, message } = parsed.data;
  const to = e.RESEND_TO ?? "catopia@chenantunez.com";
  const from = e.RESEND_FROM ?? "Catopia <noreply@catopia.chenantunez.com>";
  const prefix = e.RESEND_SUBJECT_PREFIX ?? "[CLIENT INQUIRY]";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `${prefix} ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  return NextResponse.json({ success: true });
}
