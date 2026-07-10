import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Code2, Bot, HeartPulse, Wrench, CheckCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SERVICE_SLUGS, type ServiceKey } from "@/lib/services";

export const dynamic = "force-static";

const ICONS: Record<ServiceKey, typeof Code2> = {
  software: Code2,
  ai: Bot,
  healthcare: HeartPulse,
  consulting: Wrench,
};

export function generateStaticParams() {
  return SERVICE_SLUGS.map(({ slug }) => ({ slug }));
}

function findService(slug: string) {
  return SERVICE_SLUGS.find((s) => s.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const service = findService(slug);
  if (!service) return {};
  const t = await getTranslations("services");
  return {
    title: t(`${service.key}.title`),
    description: t(`${service.key}.description`),
  };
}

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const service = findService(slug);
  if (!service) notFound();

  const { key } = service;
  const t = await getTranslations("services");
  const Icon = ICONS[key];
  const includes = t.raw(`${key}.includes`) as string[];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-5 p-6 sm:p-8 rounded-xl border border-foreground/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-foreground/5">
            <Icon size={22} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(`${key}.title`)}
          </h1>
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
        <Link
          href={`/contact?service=${slug}`}
          className="mt-2 self-start rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
        >
          {t("getQuoteCta")}
        </Link>
      </div>

      {key === "healthcare" && (
        <div className="mt-8 flex flex-col gap-6 p-6 sm:p-8 rounded-xl border border-foreground/10">
          <h2 className="text-lg font-semibold">
            {t("healthcare.expanded.title")}
          </h2>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-foreground/80">
              {t("healthcare.expanded.patientManagementTitle")}
            </h3>
            <p className="text-sm text-foreground/65 leading-relaxed">
              {t("healthcare.expanded.patientManagementBody")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-foreground/80">
              {t("healthcare.expanded.clinicalWorkflowsTitle")}
            </h3>
            <p className="text-sm text-foreground/65 leading-relaxed">
              {t("healthcare.expanded.clinicalWorkflowsBody")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-foreground/80">
              {t("healthcare.expanded.interoperabilityTitle")}
            </h3>
            <p className="text-sm text-foreground/65 leading-relaxed">
              {t("healthcare.expanded.interoperabilityBody")}
            </p>
          </div>

          <Link
            href="/case-studies"
            className="text-sm font-medium hover:underline underline-offset-4 w-fit"
          >
            {t("healthcare.expanded.caseStudyCta")} →
          </Link>
        </div>
      )}
    </div>
  );
}
