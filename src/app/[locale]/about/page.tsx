import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle } from "lucide-react";

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
  const intro = t.raw("intro") as string[];
  const whatWeDoItems = t.raw("whatWeDo.items") as string[];
  const ourApproachItems = t.raw("ourApproach.items") as string[];
  const ourExperienceItems = t.raw("ourExperience.items") as string[];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8 md:mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl mb-12 md:mb-16">
        {intro.map((paragraph, i) => (
          <p key={i} className="text-foreground/70 text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 md:mb-16">
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">{t("whatWeDo.title")}</h2>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {t("whatWeDo.intro")}
          </p>
          <ul className="flex flex-col gap-2">
            {whatWeDoItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-foreground/70"
              >
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">{t("ourApproach.title")}</h2>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {t("ourApproach.intro")}
          </p>
          <ul className="flex flex-col gap-2">
            {ourApproachItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-foreground/70"
              >
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">{t("ourExperience.title")}</h2>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {t("ourExperience.intro")}
          </p>
          <ul className="flex flex-col gap-2">
            {ourExperienceItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-foreground/70"
              >
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {t("ourExperience.outro")}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-6">{t("teamTitle")}</h2>
      <div className="flex flex-col gap-6 max-w-3xl">
        {members.map(({ key, initials }) => {
          const bio = t.raw(`members.${key}.bio`) as string[];
          const tags = t.raw(`members.${key}.tags`) as string[];

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row gap-5 sm:gap-8 p-6 sm:p-8 rounded-xl border border-foreground/10"
            >
              <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:w-40 shrink-0">
                <div className="w-14 h-14 rounded-full bg-foreground/8 flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-foreground/60">
                    {initials}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold">{t(`members.${key}.name`)}</p>
                  <p className="text-sm text-foreground/60">
                    {t(`members.${key}.role`)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 min-w-0">
                <ul className="flex flex-col gap-2.5">
                  {bio.map((point, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground/70 leading-relaxed pl-4 relative before:content-['·'] before:absolute before:left-0 before:text-foreground/30 before:font-bold"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
