import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Globe, Code2, HeartPulse, Wrench, CheckCircle } from "lucide-react";

export const dynamic = "force-static";

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

const services = [
  { key: "business", icon: Globe, hasIdealFor: true },
  { key: "software", icon: Code2, hasIdealFor: false },
  { key: "healthcare", icon: HeartPulse, hasIdealFor: false },
  { key: "consulting", icon: Wrench, hasIdealFor: false },
] as const;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map(({ key, icon: Icon, hasIdealFor }) => {
          const includes = t.raw(`${key}.includes`) as string[];
          const idealFor = hasIdealFor
            ? (t.raw(`${key}.idealFor`) as string[])
            : null;

          return (
            <div
              key={key}
              className="flex flex-col gap-5 p-5 sm:p-8 rounded-xl border border-foreground/10"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-foreground/5">
                  <Icon size={22} />
                </div>
                <h2 className="text-lg font-semibold">{t(`${key}.title`)}</h2>
              </div>
              <p className="text-sm text-foreground/65 leading-relaxed">
                {t(`${key}.description`)}
              </p>
              <ul className="flex flex-col gap-2">
                {includes.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-foreground/60"
                  >
                    <CheckCircle size={15} className="mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              {idealFor && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {idealFor.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-foreground/8 text-foreground/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
