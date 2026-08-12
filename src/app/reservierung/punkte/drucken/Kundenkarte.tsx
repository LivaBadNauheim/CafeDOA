import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/logo-path";
import { KARTEN_LAYOUT, type QrPfad } from "@/lib/karte";

type Props = { token: string; qr: QrPfad };

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

const CREME = "#f6efe1";
const TINTE = "#221d16";
const GRUEN = "#1f3327";

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
    // Schnittlinie zum Ausschneiden. Druckt hellgrau mit, stört auf der
    // fertigen Karte nicht, weil genau darauf geschnitten wird.
    outline: "0.1mm solid #d8cdb8",
  };

  if (KARTEN_LAYOUT === "dunkel") {
    return (
      <div style={{ ...rahmen, background: TINTE, color: CREME, padding: "6mm", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2.2mm" }}>
            <Zeichen farbe={CREME} mm={8.5} />
            <span style={{ fontSize: "5mm", fontWeight: 700, letterSpacing: "0.08em" }}>DOA</span>
          </div>
          <div>
            <div style={{ fontSize: "2.4mm", opacity: 0.7 }}>Punkte sammeln</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "3.6mm", fontWeight: 600, letterSpacing: "0.09em" }}>
              {token}
            </div>
          </div>
        </div>
        {/* Heller Untergrund: Auf dunklem Grund lesen viele Kameras den Code nicht. */}
        <div style={{ background: CREME, borderRadius: "2mm", padding: "2mm", alignSelf: "center", display: "flex" }}>
          <QrBild qr={qr} farbe={TINTE} mm={26} />
        </div>
      </div>
    );
  }

  if (KARTEN_LAYOUT === "zweigeteilt") {
    return (
      <div style={{ ...rahmen, background: CREME, color: TINTE }}>
        <div
          style={{
            background: GRUEN, width: "26mm", flex: "0 0 26mm", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2.5mm",
          }}
        >
          <Zeichen farbe={CREME} mm={10} />
          <span style={{ color: CREME, fontSize: "5mm", fontWeight: 700, letterSpacing: "0.08em" }}>DOA</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5mm" }}>
          <QrBild qr={qr} farbe={TINTE} mm={26} />
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "3.6mm", fontWeight: 600, letterSpacing: "0.09em" }}>
            {token}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...rahmen, background: CREME, color: TINTE, padding: "6mm", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2.2mm" }}>
          <Zeichen farbe={TINTE} mm={8.5} />
          <span style={{ fontSize: "5mm", fontWeight: 700, letterSpacing: "0.08em" }}>DOA</span>
        </div>
        <div>
          <div style={{ fontSize: "2.4mm", opacity: 0.7 }}>Punkte sammeln</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "3.6mm", fontWeight: 600, letterSpacing: "0.09em" }}>
            {token}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <QrBild qr={qr} farbe={TINTE} mm={29} />
      </div>
    </div>
  );
}
