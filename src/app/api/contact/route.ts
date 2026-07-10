import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  turnstileToken: z.string().min(1),
});

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";

  const { success: withinRateLimit } = await env.CONTACT_RATE_LIMITER.limit({
    key: ip,
  });
  if (!withinRateLimit)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 },
    );

  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { name, email, subject, message, turnstileToken } = parsed.data;

  const turnstileRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: ip,
      }),
    },
  );
  const turnstileResult = (await turnstileRes.json()) as { success: boolean };
  if (!turnstileResult.success)
    return NextResponse.json(
      { error: "Captcha verification failed" },
      { status: 403 },
    );

  try {
    await env.DB.prepare(
      "INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)",
    )
      .bind(name, email, subject, message)
      .run();
  } catch (err) {
    console.error("Failed to store contact submission in D1", err);
  }

  const to = env.RESEND_TO ?? "catopia@chenantunez.com";
  const from = env.RESEND_FROM ?? "Catopia <noreply@catopia.chenantunez.com>";
  const prefix = env.RESEND_SUBJECT_PREFIX ?? "[CLIENT INQUIRY]";

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
