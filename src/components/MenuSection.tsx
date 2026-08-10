"use client";

import { useState } from "react";
import { menuCategories, glutenfreiesBrotHinweis } from "@/lib/menu-data";

export default function MenuSection() {
  const [activeSlug, setActiveSlug] = useState(menuCategories[0].slug);
  const active = menuCategories.find((c) => c.slug === activeSlug) ?? menuCategories[0];
  const showGlutenHint = ["breads", "poached-egg"].includes(active.slug);

  return (
    <section id="menu" className="bg-cream-soft py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Karte</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Limos, die wir selbst ansetzen, frisch gepresste Säfte und Bowls
            mit viel Grün. Vieles davon vegan.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Kategorien der Karte"
          className="mt-8 flex flex-wrap gap-2"
        >
          {menuCategories.map((category) => (
            <button
              key={category.slug}
              type="button"
              role="tab"
              aria-selected={category.slug === activeSlug}
              onClick={() => setActiveSlug(category.slug)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category.slug === activeSlug
                  ? "bg-ink text-cream"
                  : "bg-cream text-ink-soft hover:bg-cream-deep"
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {active.subtitle && (
            <p className="mb-6 text-sm font-medium text-terracotta">{active.subtitle}</p>
          )}
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {active.groups.map((group, gi) => (
              <div key={group.title ?? gi}>
                {group.title && (
                  <h3 className="font-display text-lg font-semibold text-ink">{group.title}</h3>
                )}
                {group.note && (
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft/70">
                    {group.note}
                  </p>
                )}
                <ul className="mt-4 space-y-4">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4">
                      <div>
                        <p className="font-medium text-ink">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-ink-soft">{item.description}</p>
                        )}
                        {item.addOns && (
                          <p className="mt-0.5 text-sm text-ink-soft/80">
                            {item.addOns.map((a) => `${a.label} ${a.price}`).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="whitespace-nowrap font-medium text-ink-soft">
                        {item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {showGlutenHint && (
            <p className="mt-8 text-sm italic text-ink-soft/70">{glutenfreiesBrotHinweis}</p>
          )}
        </div>
      </div>
    </section>
  );
}
