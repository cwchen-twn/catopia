import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-static";

type CaseStudy = {
  title: string;
  challenge: string;
  solution: string;
  technology: string[];
  result: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("caseStudies");
  return { title: t("title") };
}

export default async function CaseStudies({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("caseStudies");
  const items = t.raw("items") as CaseStudy[];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8 md:mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-foreground/60">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-8 max-w-3xl">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-6 p-6 sm:p-8 rounded-xl border border-foreground/10"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                {t("challengeLabel")}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {item.challenge}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                {t("solutionLabel")}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {item.solution}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                {t("technologyLabel")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.technology.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-foreground/8 text-foreground/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                {t("resultLabel")}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {item.result}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
