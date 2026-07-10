import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const checkEmailSchema = z.object({
  email: z.email(),
  // Only required in production — see TURNSTILE_ENABLED in contact-form.tsx.
  turnstileToken: z.string().min(1).optional(),
});

interface InquiryRow {
  subject: string;
  created_at: string;
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";

  const { success: withinRateLimit } = await env.CONTACT_RATE_LIMITER.limit({
    key: ip,
  });
  if (!withinRateLimit)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = checkEmailSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { email, turnstileToken } = parsed.data;

  if (process.env.NODE_ENV === "production") {
    if (!turnstileToken)
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 403 },
      );

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
    const turnstileResult = (await turnstileRes.json()) as {
      success: boolean;
    };
    if (!turnstileResult.success)
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 403 },
      );
  }

  const client = await env.DB.prepare(
    "SELECT 1 FROM clients WHERE email = ? AND status = 'active' LIMIT 1",
  )
    .bind(email)
    .first();

  if (!client) return NextResponse.json({ hasActiveDeal: false });

  const { results } = await env.DB.prepare(
    "SELECT subject, created_at FROM contact_submissions WHERE email = ? ORDER BY created_at DESC LIMIT 5",
  )
    .bind(email)
    .all<InquiryRow>();

  return NextResponse.json({
    hasActiveDeal: true,
    inquiries: results.map((r) => ({
      subject: r.subject,
      createdAt: r.created_at,
    })),
  });
}
