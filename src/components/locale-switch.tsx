"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const locales = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇵🇾", label: "ES" },
  { code: "pt", flag: "🇧🇷", label: "PT" },
] as const;

type Locale = (typeof locales)[number]["code"];

export function LocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations("contact");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  function navigate(nextLocale: Locale) {
    // next-intl's usePathname() strips the query string by design, so it
    // has to be re-appended manually — otherwise switching locale drops
    // params like ?service=... from the Get a Quote flow.
    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      locale: nextLocale,
    });
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value as Locale;

    // The contact form fully remounts on a locale-prefixed navigation, so
    // any typed content is lost — confirm before switching away from it.
    if (pathname.startsWith("/contact")) {
      setPendingLocale(nextLocale);
      return;
    }

    navigate(nextLocale);
  }

  return (
    <>
      <div className="relative flex items-center">
        <select
          value={locale}
          onChange={onChange}
          aria-label="Switch language"
          className="appearance-none text-xs font-mono pl-2 pr-6 py-1 rounded-md border border-foreground/20 bg-background text-foreground hover:bg-foreground/8 transition-colors cursor-pointer"
        >
          {locales.map(({ code, flag, label }) => (
            <option
              key={code}
              value={code}
              className="bg-background text-foreground"
            >
              {flag} {label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-1.5 pointer-events-none text-foreground/50"
        />
      </div>

      {pendingLocale && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-sm rounded-xl border border-foreground/10 bg-background p-6 flex flex-col gap-4 shadow-xl">
            <p className="text-sm text-foreground/80">
              {t("localeChangeWarning")}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingLocale(null)}
                className="rounded-lg border border-foreground/20 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextLocale = pendingLocale;
                  setPendingLocale(null);
                  navigate(nextLocale);
                }}
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity cursor-pointer"
              >
                {t("localeChangeConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
