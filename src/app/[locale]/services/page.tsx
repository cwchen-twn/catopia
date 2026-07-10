import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Code2, Bot, HeartPulse, Wrench, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SERVICE_SLUGS, type ServiceKey } from "@/lib/services";

export const dynamic = "force-static";

const ICONS: Record<ServiceKey, typeof Code2> = {
  software: Code2,
  ai: Bot,
  healthcare: HeartPulse,
  consulting: Wrench,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  return { title: t("title") };
}

export default async function Services({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8 md:mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {SERVICE_SLUGS.map(({ slug, key }) => {
          const Icon = ICONS[key];
          return (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="flex flex-col gap-3 p-6 rounded-xl border border-foreground/10 hover:border-foreground/20 transition-colors"
            >
              <Icon size={24} className="text-foreground/40" />
              <h2 className="font-semibold">{t(`${key}.title`)}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {t(`${key}.description`)}
              </p>
              <span className="mt-auto flex items-center gap-1 text-sm font-medium pt-1">
                {t("learnMore")}
                <ArrowRight size={15} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
