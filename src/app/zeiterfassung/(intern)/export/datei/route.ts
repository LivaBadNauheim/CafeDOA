import writeXlsxFile from "write-excel-file/node";
import { alleEintraege, alsAdmin } from "@/lib/zeit-server";
import { monatName, stunden, uhrzeit, wochentagName, TYPEN } from "@/lib/zeit";

export const dynamic = "force-dynamic";

const TYP_LABEL = new Map(TYPEN.map((typ) => [typ.wert, typ.label]));

/** Minuten als Dezimalstunden - so lässt sich in Excel damit rechnen. */
function dezimal(minuten: number): number {
  return Math.round((minuten / 60) * 100) / 100;
}

/**
 * Der Export als echte Excel-Datei.
 *
 * Als Route und nicht als Server Action: Eine Action kann keine Datei zum
 * Herunterladen zurückgeben, und ein CSV wäre kein Excel - Umlaute und
 * Trennzeichen gehen dabei je nach Einstellung kaputt.
 */
export async function GET(request: Request) {
  // Der Riegel des Bereichs gilt hier nicht: Routen laufen ohne Layout.
  if (!(await alsAdmin())) {
    return new Response("Kein Zugriff", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const von = searchParams.get("von") ?? "";
  const bis = searchParams.get("bis") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(von) || !/^\d{4}-\d{2}-\d{2}$/.test(bis) || von > bis) {
    return new Response("Zeitraum fehlt oder ist verdreht", { status: 400 });
  }

  const nurDiese = searchParams.getAll("person");
  const alle = await alleEintraege(von, bis);
  const eintraege = nurDiese.length ? alle.filter((e) => nurDiese.includes(e.user_id)) : alle;

  const kopf = { fontWeight: "bold" as const, backgroundColor: "#EFE4CF" };

  const zeiten = [
    [
      { value: "Mitarbeiter", ...kopf },
      { value: "Datum", ...kopf },
      { value: "Wochentag", ...kopf },
      { value: "Art", ...kopf },
      { value: "Beginn", ...kopf },
      { value: "Ende", ...kopf },
      { value: "Pause (Min.)", ...kopf },
      { value: "Stunden", ...kopf },
      { value: "Std:Min", ...kopf },
      { value: "Notiz", ...kopf },
    ],
    ...eintraege.map((eintrag) => [
      { value: eintrag.name, type: String },
      { value: eintrag.datum, type: String },
      { value: wochentagName(eintrag.datum), type: String },
      { value: TYP_LABEL.get(eintrag.typ) ?? eintrag.typ, type: String },
      { value: uhrzeit(eintrag.beginn), type: String },
      { value: uhrzeit(eintrag.ende), type: String },
      { value: eintrag.pause_minuten, type: Number },
      { value: dezimal(eintrag.minuten), type: Number, format: "0.00" },
      { value: stunden(eintrag.minuten), type: String },
      { value: eintrag.notiz ?? "", type: String },
    ]),
  ];

  // Zweites Blatt mit Monatssummen: Genau das, was für die Abrechnung
  // gebraucht wird - sonst müsste es jemand von Hand zusammenzählen.
  const summen = new Map<
    string,
    { name: string; monat: string; minuten: number; urlaub: number; krank: number; frei: number }
  >();
  for (const eintrag of eintraege) {
    const schluessel = `${eintrag.user_id}|${eintrag.datum.slice(0, 7)}`;
    const stand =
      summen.get(schluessel) ??
      { name: eintrag.name, monat: eintrag.datum.slice(0, 7), minuten: 0, urlaub: 0, krank: 0, frei: 0 };
    stand.minuten += eintrag.minuten;
    if (eintrag.typ === "urlaub") stand.urlaub += 1;
    if (eintrag.typ === "krank") stand.krank += 1;
    if (eintrag.typ === "frei") stand.frei += 1;
    summen.set(schluessel, stand);
  }

  const summenBlatt = [
    [
      { value: "Mitarbeiter", ...kopf },
      { value: "Monat", ...kopf },
      { value: "Stunden", ...kopf },
      { value: "Std:Min", ...kopf },
      { value: "Urlaubstage", ...kopf },
      { value: "Kranktage", ...kopf },
      { value: "Freie Tage", ...kopf },
    ],
    ...[...summen.values()]
      .sort((a, b) => a.name.localeCompare(b.name) || a.monat.localeCompare(b.monat))
      .map((stand) => [
        { value: stand.name, type: String },
        { value: monatName(`${stand.monat}-01`), type: String },
        { value: dezimal(stand.minuten), type: Number, format: "0.00" },
        { value: stunden(stand.minuten), type: String },
        { value: stand.urlaub, type: Number },
        { value: stand.krank, type: Number },
        { value: stand.frei, type: Number },
      ]),
  ];

  const datei = await writeXlsxFile([
    {
      data: zeiten,
      sheet: "Zeiten",
      columns: [24, 12, 12, 10, 9, 9, 12, 10, 10, 32].map((width) => ({ width })),
    },
    {
      data: summenBlatt,
      sheet: "Monatssummen",
      columns: [24, 16, 10, 10, 12, 12, 12].map((width) => ({ width })),
    },
  ]).toBuffer();

  return new Response(new Uint8Array(datei), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="Zeiten_${von}_bis_${bis}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
