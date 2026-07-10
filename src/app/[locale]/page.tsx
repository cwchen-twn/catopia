import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Code2, Bot, HeartPulse, Wrench } from "lucide-react";
import { SERVICE_SLUGS, type ServiceKey } from "@/lib/services";

const ICONS: Record<ServiceKey, typeof Code2> = {
  software: Code2,
  ai: Bot,
  healthcare: HeartPulse,
  consulting: Wrench,
};

export const dynamic = "force-static";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 py-14 md:py-24">
        <Image
          src="/images/catopia-256.webp"
          alt="Catopia"
          width={96}
          height={96}
          priority
          className="rounded-2xl"
        />
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t("home.hero.title")}
          </h1>
          <p className="text-lg sm:text-xl text-foreground/60 max-w-xl">
            {t("home.hero.description")}
          </p>
        </div>
        <p className="text-foreground/60 max-w-lg text-sm leading-relaxed">
          {t("home.hero.subDescription")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/contact"
            className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
          >
            {t("home.hero.primaryCta")}
          </Link>
          <Link
            href="/services"
            className="rounded-lg border border-foreground/15 px-6 py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors"
          >
            {t("home.hero.secondaryCta")}
          </Link>
        </div>
      </section>

      {/* Services preview */}
      <section className="border-t border-foreground/10 py-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {SERVICE_SLUGS.map(({ slug, key }) => {
          const Icon = ICONS[key];
          return (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="flex flex-col gap-3 p-6 rounded-xl border border-foreground/10 hover:border-foreground/20 transition-colors"
            >
              <Icon size={24} className="text-foreground/40" />
              <h2 className="font-semibold">{t(`services.${key}.title`)}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {t(`services.${key}.description`)}
              </p>
            </Link>
          );
        })}
      </section>

      {/* About blurb */}
      <section className="border-t border-foreground/10 py-16 flex flex-col gap-4 max-w-2xl">
        <h2 className="text-xl font-semibold">{t("home.whoTitle")}</h2>
        <p className="text-foreground/65 text-sm leading-relaxed">
          {t("home.whoDesc")}
        </p>
        <Link
          href="/about"
          className="text-sm font-medium hover:underline underline-offset-4 w-fit"
        >
          {t("nav.about")} →
        </Link>
      </section>
    </div>
  );
}
