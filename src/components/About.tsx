import { GALLERY_PLACEHOLDERS, PlaceholderTile } from "./PlaceholderTile";

export default function About() {
  const tiles = GALLERY_PLACEHOLDERS.slice(0, 3);

  return (
    <section id="ueber-uns" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow">Über uns</p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-ink sm:text-4xl">
            Unser DOA-Flair
          </h2>
          <p className="mt-6 leading-relaxed text-ink-soft">
            Im DOA verbinden wir guten Kaffee mit einer entspannten,
            wohnlichen Atmosphäre – warme Farben, viele Pflanzen und Platz zum
            Verweilen. Ob schneller Kaffee to go, ausgiebiges Frühstück oder
            Lunch mit Freunden: bei uns ist für jede Tageszeit etwas dabei.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Besonders am Herzen liegen uns frische, gesunde Zutaten – von
            Matcha und Acai Bowls bis zu unseren herzhaften Bowls und
            Avocado-Broten, viele Optionen davon vegan oder vegetarisch.
          </p>
          <p className="mt-4 text-xs text-ink-soft/60">
            (Platzhaltertext – gerne durch eure eigene Café-Geschichte ersetzen.)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
          {tiles.map((tile, i) => (
            <div key={tile.key} className={i === 0 ? "col-span-2 lg:col-span-2" : ""}>
              <PlaceholderTile variant={tile} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
