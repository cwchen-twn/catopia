"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useTranslations } from "next-intl";

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

export function ContactForm() {
  const t = useTranslations("contact");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ email: form.email }),
      });
      const checkData = (await checkRes.json()) as { exists?: boolean };
      if (checkData.exists) {
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
