import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const checkEmailSchema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  const { env } = getCloudflareContext();

  const parsed = checkEmailSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const row = await env.DB.prepare(
    "SELECT 1 FROM contact_submissions WHERE email = ? LIMIT 1",
  )
    .bind(parsed.data.email)
    .first();

  return NextResponse.json({ exists: !!row });
}
