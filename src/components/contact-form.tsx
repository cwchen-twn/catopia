"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SERVICE_SLUGS } from "@/lib/services";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type Status = "idle" | "checking" | "confirm" | "sending" | "success" | "error";
type ErrorKind = "generic" | "captcha" | "rateLimit";
type Inquiry = { subject: string; createdAt: string };

export function ContactForm() {
  const t = useTranslations("contact");
  const tServices = useTranslations("services");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const service = SERVICE_SLUGS.find(
    (s) => s.slug === searchParams.get("service"),
  );
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    subject: service ? tServices(`${service.key}.title`) : "",
    message: service ? tServices(`${service.key}.quoteTemplate`) : "",
  }));
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [ongoingInquiries, setOngoingInquiries] = useState<Inquiry[]>([]);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  function formatInquiryDate(createdAt: string) {
    // D1's datetime('now') is UTC with no offset marker; append "Z" so it's
    // parsed as UTC, then format with no explicit timeZone so it renders in
    // the visitor's own local timezone (Intl.DateTimeFormat's default).
    const date = new Date(createdAt.replace(" ", "T") + "Z");
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  useEffect(() => {
    if (!scriptLoaded || !turnstileContainerRef.current || !window.turnstile)
      return;
    window.turnstile.render(turnstileContainerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
  }, [scriptLoaded]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function sendContact() {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      if (!res.ok) {
        setErrorKind(
          res.status === 429
            ? "rateLimit"
            : res.status === 403
              ? "captcha"
              : "generic",
        );
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setErrorKind("generic");
      setStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setErrorKind("captcha");
      setStatus("error");
      return;
    }
    setStatus("checking");
    try {
      const checkRes = await fetch("/api/contact/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, turnstileToken }),
      });
      const checkData = (await checkRes.json()) as {
        hasActiveDeal?: boolean;
        inquiries?: Inquiry[];
      };
      if (checkData.hasActiveDeal) {
        setOngoingInquiries(checkData.inquiries ?? []);
        setStatus("confirm");
        return;
      }
    } catch {
      // duplicate check failing shouldn't block a legitimate send
    }
    await sendContact();
  }

  const inputClass =
    "w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/25 transition-shadow";

  if (status === "success") {
    return (
      <div className="rounded-lg border border-foreground/20 px-6 py-10 text-center flex flex-col gap-2">
        <p className="font-medium">{t("successTitle")}</p>
        <p className="text-sm text-foreground/60">{t("successMessage")}</p>
      </div>
    );
  }

  if (status === "confirm") {
    return (
      <div className="rounded-lg border border-foreground/20 px-6 py-8 flex flex-col gap-4">
        <p className="text-sm text-foreground/80">{t("duplicateMessage")}</p>
        {ongoingInquiries.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-foreground/60">
              {t("ongoingInquiriesLabel")}
            </p>
            <ul className="flex flex-col gap-1.5">
              {ongoingInquiries.map((inquiry, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 text-sm text-foreground/70"
                >
                  <span className="truncate">{inquiry.subject}</span>
                  <span className="shrink-0 text-xs text-foreground/45">
                    {formatInquiryDate(inquiry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="rounded-lg border border-foreground/20 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={sendContact}
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity cursor-pointer"
          >
            {t("confirmSend")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {service && (
        <p className="text-sm text-foreground/60">
          {t("inquiringAboutLabel")}{" "}
          <span className="font-medium text-foreground">
            {tServices(`${service.key}.title`)}
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="subject">
          {t("subject")}
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          value={form.subject}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="message">
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          value={form.message}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div ref={turnstileContainerRef} />

      {status === "error" && (
        <p className="text-sm text-red-500">
          {t(
            errorKind === "rateLimit"
              ? "rateLimitMessage"
              : errorKind === "captcha"
                ? "captchaErrorMessage"
                : "errorMessage",
          )}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-foreground/55">{t("hint")}</p>
        <button
          type="submit"
          disabled={status === "sending" || status === "checking"}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity cursor-pointer self-stretch sm:self-auto text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "sending" || status === "checking"
            ? t("sending")
            : t("send")}
        </button>
      </div>
    </form>
  );
}
