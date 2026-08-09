const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type ReservationDetails = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  message?: string;
};

export const isEmailConfigured = Boolean(
  process.env.RESEND_API_KEY &&
    process.env.RESERVATION_NOTIFICATION_TO &&
    process.env.RESERVATION_NOTIFICATION_FROM,
);

function formatGermanDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notifies the café about a new reservation request.
 *
 * Never throws: a failed notification must not turn a successfully stored
 * reservation into an error for the guest. The request is already safe in
 * the database and visible in Supabase Studio either way.
 */
export async function sendReservationNotification(details: ReservationDetails): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESERVATION_NOTIFICATION_TO;
  const from = process.env.RESERVATION_NOTIFICATION_FROM;

  if (!apiKey || !to || !from) return;

  const dateLabel = formatGermanDate(details.date);
  const subject = `Neue Reservierung: ${details.name}, ${dateLabel} um ${details.time} Uhr (${details.partySize} Pers.)`;

  const rows: [string, string][] = [
    ["Name", details.name],
    ["Datum", `${dateLabel} um ${details.time} Uhr`],
    ["Personen", String(details.partySize)],
    ["Telefon", details.phone],
    ["E-Mail", details.email],
  ];
  if (details.message) rows.push(["Nachricht", details.message]);

  const html = `
    <div style="font-family: system-ui, sans-serif; color: #221d16;">
      <h2 style="margin-bottom: 16px;">Neue Reservierungsanfrage</h2>
      <table style="border-collapse: collapse;">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding: 6px 20px 6px 0; color: #4a4238;">${escapeHtml(label)}</td>
            <td style="padding: 6px 0; font-weight: 600;">${escapeHtml(value)}</td>
          </tr>`,
          )
          .join("")}
      </table>
      <p style="margin-top: 20px; color: #4a4238; font-size: 14px;">
        Die Anfrage steht auch im Supabase Table Editor unter „reservations“.
      </p>
    </div>
  `;

  const text = [
    "Neue Reservierungsanfrage",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((address) => address.trim()),
        reply_to: details.email,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Reservation notification failed", response.status, await response.text());
    }
  } catch (error) {
    console.error("Reservation notification failed", error);
  }
}
