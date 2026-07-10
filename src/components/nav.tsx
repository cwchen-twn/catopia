"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitch } from "./locale-switch";
import { FontSizeControl } from "./font-size-control";

const links = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/case-studies", key: "caseStudies" },
  { href: "/blog", key: "blog" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Nav({ hasBlogPosts }: { hasBlogPosts: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleLinks = links.filter(
    (link) => link.key !== "blog" || hasBlogPosts,
  );

  function close() {
    setOpen(false);
  }

  return (
    <header className="border-b border-foreground/10 sticky top-0 z-10 backdrop-blur bg-background/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-2 font-semibold shrink-0"
        >
          <Image src="/favicon.png" alt="" width={24} height={24} />
          Catopia
        </Link>

        {/* Desktop links */}
        <nav
          className="hidden md:flex items-center gap-1 flex-1"
          aria-label="Main navigation"
        >
          {visibleLinks.map(({ href, key }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  active
                    ? "font-medium"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <FontSizeControl />
          <LocaleSwitch />
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="md:hidden p-1.5 rounded-md hover:bg-foreground/8 transition-colors cursor-pointer"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="md:hidden border-t border-foreground/10 px-4 py-2 flex flex-col"
          aria-label="Main navigation"
        >
          {visibleLinks.map(({ href, key }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`px-3 py-3 rounded-md text-sm transition-colors ${
                  active
                    ? "font-medium"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
