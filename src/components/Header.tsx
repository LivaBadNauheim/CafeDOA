"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { CloseIcon, InstagramIcon, MenuIcon, PhoneIcon } from "./icons";
import { CAFE_INFO } from "@/lib/cafe-info";

// Absolute so they also work from the Impressum and privacy pages, where a
// bare "#menu" would jump nowhere.
const NAV_LINKS = [
  { href: "/#ueber-uns", label: "Über uns" },
  { href: "/#menu", label: "Menü" },
  { href: "/#galerie", label: "Galerie" },
  { href: "/#reservierung", label: "Reservieren" },
  { href: "/#kontakt", label: "Kontakt" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/#top" className="text-ink" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-terracotta">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={CAFE_INFO.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Café DOA auf Instagram"
            className="text-ink-soft transition-colors hover:text-terracotta"
          >
            <InstagramIcon />
          </a>
          <Link
            href="/#reservierung"
            className="rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-green-light"
          >
            Tisch reservieren
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          className="text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-cream px-5 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1 text-base font-medium text-ink-soft">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-2.5 transition-colors hover:bg-cream-soft"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-4">
            <a
              href={`tel:${CAFE_INFO.phoneHref}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft"
            >
              <PhoneIcon className="h-4 w-4" /> {CAFE_INFO.phoneDisplay}
            </a>
            <a
              href={CAFE_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-ink-soft"
              aria-label="Café DOA auf Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
