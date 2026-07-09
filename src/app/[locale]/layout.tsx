import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeScript } from "@/components/theme-script";
import { FontSizeScript } from "@/components/font-size-script";
import { ThemeRestorer } from "@/components/theme-restorer";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const localeMeta = {
  en: {
    title:
      "Custom Software Development & Web Solutions for Businesses | Catopia",
    description:
      "Catopia helps businesses build modern websites, custom software systems, and digital tools that improve operations and customer experience.",
    keywords: [
      "custom software development Paraguay",
      "software development company Asuncion",
      "business website development Paraguay",
      "healthcare software development",
      "business automation solutions",
      "custom web application development",
      "software consulting Paraguay",
    ],
    ogLocale: "en_US",
  },
  es: {
    title:
      "Desarrollo de Software a Medida y Soluciones Web para Empresas | Catopia",
    description:
      "Catopia ayuda a las empresas a construir sitios web modernos, sistemas de software a medida y herramientas digitales que mejoran las operaciones y la experiencia del cliente.",
    keywords: [
      "desarrollo de software a medida Paraguay",
      "empresa de desarrollo de software Asunción",
      "desarrollo de sitios web para empresas Paraguay",
      "desarrollo de software para salud",
      "soluciones de automatización empresarial",
      "desarrollo de aplicaciones web a medida",
      "consultoría de software Paraguay",
    ],
    ogLocale: "es_PY",
  },
  pt: {
    title:
      "Desenvolvimento de Software Sob Medida e Soluções Web para Empresas | Catopia",
    description:
      "A Catopia ajuda empresas a construir sites modernos, sistemas de software sob medida e ferramentas digitais que melhoram as operações e a experiência do cliente.",
    keywords: [
      "desenvolvimento de software sob medida Paraguai",
      "empresa de desenvolvimento de software Assunção",
      "desenvolvimento de sites para empresas Paraguai",
      "desenvolvimento de software para saúde",
      "soluções de automação empresarial",
      "desenvolvimento de aplicações web sob medida",
      "consultoria de software Paraguai",
    ],
    ogLocale: "pt_BR",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = localeMeta[locale as keyof typeof localeMeta] ?? localeMeta.en;

  return {
    metadataBase: new URL("https://catopia.chenantunez.com"),
    title: { default: meta.title, template: "%s | Catopia" },
    description: meta.description,
    keywords: [...meta.keywords],
    authors: [{ name: "Catopia" }],
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      url: `https://catopia.chenantunez.com/${locale}`,
      siteName: "Catopia",
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: "https://catopia.chenantunez.com/images/og-share.png",
          width: 1200,
          height: 630,
          alt: "Catopia",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["https://catopia.chenantunez.com/images/og-share.png"],
    },
    alternates: {
      canonical: `https://catopia.chenantunez.com/${locale}`,
      languages: {
        en: "https://catopia.chenantunez.com/en",
        es: "https://catopia.chenantunez.com/es",
        pt: "https://catopia.chenantunez.com/pt",
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const meta = localeMeta[locale as keyof typeof localeMeta] ?? localeMeta.en;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Catopia",
    description: meta.description,
    url: `https://catopia.chenantunez.com/${locale}`,
    founder: [
      { "@type": "Person", name: "Chun Wei Chen" },
      { "@type": "Person", name: "Yun Jie Zhang" },
    ],
    areaServed: "Paraguay",
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <FontSizeScript />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeRestorer />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
