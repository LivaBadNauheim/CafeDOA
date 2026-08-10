import Link from "next/link";
import Logo from "./Logo";
import { InstagramIcon, PhoneIcon } from "./icons";
import { CAFE_INFO } from "@/lib/cafe-info";

export default function Footer() {
  return (
    <footer id="kontakt" className="bg-ink py-14 text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-3 sm:px-8">
        <div>
          <Logo className="text-cream" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Kaffee, Frühstück und Lunch in Bad Nauheim.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream">Hier sind wir</h3>
          <a
            href={CAFE_INFO.mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 block text-sm leading-relaxed transition-colors hover:text-cream"
          >
            {CAFE_INFO.street}
            <br />
            {CAFE_INFO.postalCity}
          </a>
          <p className="mt-4 text-sm leading-relaxed">
            {CAFE_INFO.openingHours}
            <br />
            {CAFE_INFO.kitchenHours}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream">Kontakt</h3>
          <a
            href={`tel:${CAFE_INFO.phoneHref}`}
            className="mt-3 flex items-center gap-2 text-sm transition-colors hover:text-cream"
          >
            <PhoneIcon className="h-4 w-4" /> {CAFE_INFO.phoneDisplay}
          </a>
          <a
            href="mailto:info@cafe-doa.de"
            className="mt-3 block text-sm transition-colors hover:text-cream"
          >
            info@cafe-doa.de
          </a>
          <a
            href={CAFE_INFO.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 flex items-center gap-2 text-sm transition-colors hover:text-cream"
          >
            <InstagramIcon className="h-4 w-4" /> {CAFE_INFO.instagramHandle}
          </a>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-5 text-xs text-cream/50 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>
            © {new Date().getFullYear()} {CAFE_INFO.name}
          </span>
          <Link href="/impressum" className="underline transition-colors hover:text-cream">
            Impressum
          </Link>
          <Link href="/datenschutz" className="underline transition-colors hover:text-cream">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}
