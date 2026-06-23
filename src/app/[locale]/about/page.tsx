import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return { title: t("title") };
}

const members = [
  { key: "chunwei", initials: "CW" },
  { key: "yuejie", initials: "YJ" },
] as const;

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8 md:mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {members.map(({ key, initials }) => (
          <div
            key={key}
            className="flex flex-col gap-4 p-6 rounded-xl border border-foreground/10"
          >
            <div className="w-14 h-14 rounded-full bg-foreground/8 flex items-center justify-center">
              <span className="text-lg font-semibold text-foreground/60">
                {initials}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{t(`members.${key}.name`)}</p>
              <p className="text-sm text-foreground/60">
                {t(`members.${key}.role`)}
              </p>
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">
                {t(`members.${key}.bio`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
