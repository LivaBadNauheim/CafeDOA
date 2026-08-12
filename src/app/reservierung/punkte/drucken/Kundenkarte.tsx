import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/logo-path";
import { KARTEN_LAYOUT, MIT_NAMENSLINIE, type QrPfad } from "@/lib/karte";

type Props = { token: string; qr: QrPfad };

const CREME = "#f6efe1";
const TINTE = "#221d16";
const GRUEN = "#1f3327";

function Zeichen({ farbe, mm }: { farbe: string; mm: number }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} style={{ width: `${mm}mm`, height: `${mm}mm` }} aria-hidden="true">
      <path d={LOGO_PATH} fill={farbe} fillRule="evenodd" />
    </svg>
  );
}

function QrBild({ qr, farbe, mm }: { qr: QrPfad; farbe: string; mm: number }) {
  return (
    <svg
      viewBox={qr.viewBox}
      style={{ width: `${mm}mm`, height: `${mm}mm` }}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* stroke, nicht fill - siehe Kommentar in src/lib/karte.ts */}
      <path d={qr.d} stroke={farbe} strokeWidth={1} />
    </svg>
  );
}

/** Schreiblinie im Stil eines Formularfelds: Strich, darunter die Beschriftung. */
function Namenslinie({ farbe, breiteMm }: { farbe: string; breiteMm: number }) {
  if (!MIT_NAMENSLINIE) return null;
  return (
    <div style={{ width: `${breiteMm}mm` }}>
      <div style={{ borderBottom: `0.2mm solid ${farbe}`, opacity: 0.4, height: "5mm" }} />
      <div style={{ fontSize: "2.2mm", opacity: 0.55, marginTop: "0.8mm" }}>Name</div>
    </div>
  );
}

function Code({ token }: { token: string }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: "3.6mm",
        fontWeight: 600,
        letterSpacing: "0.09em",
      }}
    >
      {token}
    </div>
  );
}

/**
 * Eine Karte im Druckbogen.
 *
 * Alle Maße in Millimetern statt in Pixeln: Was gedruckt wird, muss
 * unabhängig von Bildschirmauflösung und Zoomstufe dieselbe Größe haben.
 */
export default function Kundenkarte({ token, qr }: Props) {
  const rahmen: React.CSSProperties = {
    width: "85mm",
    height: "55mm",
    overflow: "hidden",
    display: "flex",
    // Schnittlinie zum Ausschneiden. Als border statt outline: outline liegt
    // ausserhalb der Box und verschiebt beim Drucken das Raster.
    border: "0.1mm solid #d8cdb8",
    boxSizing: "border-box",
  };

  const marke = (farbe: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: "2.2mm" }}>
      <Zeichen farbe={farbe} mm={8.5} />
      <span style={{ fontSize: "5mm", fontWeight: 700, letterSpacing: "0.08em" }}>DOA</span>
    </div>
  );

  if (KARTEN_LAYOUT === "zweigeteilt") {
    return (
      <div style={{ ...rahmen, background: CREME, color: TINTE }}>
        {/*
          28 statt 26 mm und der Schriftzug eine Spur kleiner: Auf dem ersten
          Probedruck stiess "DOA" an die Kante des Streifens. Das Padding
          sorgt dafuer, dass es auch mit einer Ersatzschrift nicht anschlaegt,
          falls Inter beim Drucken einmal nicht geladen wird.
        */}
        <div
          style={{
            background: GRUEN, width: "28mm", flex: "0 0 28mm", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "2.5mm", padding: "0 2mm", overflow: "hidden",
          }}
        >
          <Zeichen farbe={CREME} mm={10} />
          <span style={{ color: CREME, fontSize: "4.5mm", fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            DOA
          </span>
        </div>
        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: MIT_NAMENSLINIE ? "1mm" : "1.5mm", padding: "4mm",
          }}
        >
          <QrBild qr={qr} farbe={TINTE} mm={MIT_NAMENSLINIE ? 24 : 26} />
          <Code token={token} />
          <Namenslinie farbe={TINTE} breiteMm={40} />
        </div>
      </div>
    );
  }

  const dunkel = KARTEN_LAYOUT === "dunkel";
  const grund = dunkel ? TINTE : CREME;
  const schrift = dunkel ? CREME : TINTE;

  return (
    <div style={{ ...rahmen, background: grund, color: schrift, padding: "6mm", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {marke(schrift)}
        {MIT_NAMENSLINIE ? (
          <Namenslinie farbe={schrift} breiteMm={34} />
        ) : (
          <div style={{ fontSize: "2.4mm", opacity: 0.7 }}>Punkte sammeln</div>
        )}
        <Code token={token} />
      </div>

      {dunkel ? (
        // Heller Untergrund: Auf dunklem Grund lesen viele Kameras den Code nicht.
        <div style={{ background: CREME, borderRadius: "2mm", padding: "2mm", alignSelf: "center", display: "flex" }}>
          <QrBild qr={qr} farbe={TINTE} mm={26} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center" }}>
          <QrBild qr={qr} farbe={TINTE} mm={29} />
        </div>
      )}
    </div>
  );
}
