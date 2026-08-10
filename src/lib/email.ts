import { CAFE_INFO } from "@/lib/cafe-info";

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "Freitag, 15.08.2026 um 12:30 Uhr" */
export function formatDateTime(date: string, time: string): string {
  // Midday UTC keeps the weekday correct regardless of the server's zone.
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return `${date} um ${time} Uhr`;

  const formatted = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);

  return `${formatted} um ${time} Uhr`;
}

function partyLabel(size: number): string {
  return `${size} ${size === 1 ? "Person" : "Personen"}`;
}

/** Shared shell so all mails carry the same look. */
function layout(bodyHtml: string): string {
  return `
<div style="margin:0;padding:32px 16px;background:#f6efe1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
    <p style="margin:0 0 24px;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#221d16;">DOA</p>
    ${bodyHtml}
    <hr style="margin:28px 0 16px;border:none;border-top:1px solid #e4d4b4;" />
    <p style="margin:0;font-size:13px;line-height:1.6;color:#4a4238;">
      ${escapeHtml(CAFE_INFO.name)}<br />
      ${escapeHtml(CAFE_INFO.street)}, ${escapeHtml(CAFE_INFO.postalCity)}<br />
      <a href="tel:${CAFE_INFO.phoneHref}" style="color:#bd6a3f;text-decoration:none;">${escapeHtml(CAFE_INFO.phoneDisplay)}</a>
      &nbsp;·&nbsp;
      <a href="${CAFE_INFO.siteUrl}" style="color:#bd6a3f;text-decoration:none;">cafe-doa.de</a>
    </p>
  </div>
</div>`;
}

function detailBlock(details: ReservationDetails): string {
  return `
    <p style="margin:0 0 20px;padding:16px 20px;background:#f6efe1;border-radius:12px;font-size:16px;font-weight:600;color:#221d16;">
      ${escapeHtml(formatDateTime(details.date, details.time))}<br />
      <span style="font-weight:400;color:#4a4238;">${escapeHtml(partyLabel(details.partySize))}</span>
    </p>`;
}

const footerText = `\n\n${CAFE_INFO.name}\n${CAFE_INFO.street}, ${CAFE_INFO.postalCity}\n${CAFE_INFO.phoneDisplay}\n${CAFE_INFO.siteUrl}`;

type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends through Resend. Never throws: a reservation that is already stored
 * must not fail because a mail could not go out, and the café still sees it
 * on the dashboard either way.
 */
async function send(mail: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_NOTIFICATION_FROM;
  if (!apiKey || !from) return false;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        reply_to: mail.replyTo,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });

    if (!response.ok) {
      console.error("Sending mail failed", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Sending mail failed", error);
    return false;
  }
}

/** Tells the café a request came in, so nobody has to watch the dashboard. */
export async function sendCafeNotification(details: ReservationDetails): Promise<void> {
  const to = process.env.RESERVATION_NOTIFICATION_TO;
  if (!to) return;

  const rows: [string, string][] = [
    ["Name", details.name],
    ["Wann", formatDateTime(details.date, details.time)],
    ["Personen", String(details.partySize)],
    ["Telefon", details.phone],
    ["E-Mail", details.email],
  ];
  if (details.message) rows.push(["Nachricht", details.message]);

  await send({
    to: to.split(",").map((address) => address.trim()),
    // Reaching the guest directly from the mail is the common next step.
    replyTo: details.email,
    subject: `Neue Reservierung: ${details.name}, ${formatDateTime(details.date, details.time)} (${partyLabel(details.partySize)})`,
    html: layout(`
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#221d16;">Neue Reservierungsanfrage</p>
      <table style="border-collapse:collapse;font-size:15px;color:#221d16;">
        ${rows
          .map(
            ([label, value]) => `
        <tr>
          <td style="padding:5px 20px 5px 0;color:#4a4238;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:5px 0;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:20px 0 0;font-size:14px;color:#4a4238;">
        Bestätigen oder ablehnen unter
        <a href="https://reservierung.cafe-doa.de" style="color:#bd6a3f;">reservierung.cafe-doa.de</a>
      </p>`),
    text: `Neue Reservierungsanfrage\n\n${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\nBestätigen oder ablehnen: https://reservierung.cafe-doa.de`,
  });
}

/** Mail 1: the request arrived, but is not yet binding. */
export async function sendGuestRequestReceived(details: ReservationDetails): Promise<void> {
  await send({
    to: details.email,
    replyTo: process.env.RESERVATION_NOTIFICATION_TO,
    subject: "Deine Reservierungsanfrage im Café DOA",
    html: layout(`
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#221d16;">Hallo ${escapeHtml(details.name)},</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#221d16;">
        danke für deine Anfrage! Wir haben sie erhalten und melden uns in Kürze mit der Bestätigung.
      </p>
      ${detailBlock(details)}
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a4238;font-style:italic;">
        Bitte beachte: Diese Anfrage ist noch keine feste Reservierung. Verbindlich wird sie erst mit unserer Bestätigung.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#221d16;">Bis bald, dein DOA-Team</p>`),
    text: `Hallo ${details.name},

danke für deine Anfrage! Wir haben sie erhalten und melden uns in Kürze mit der Bestätigung.

${formatDateTime(details.date, details.time)} · ${partyLabel(details.partySize)}

Bitte beachte: Diese Anfrage ist noch keine feste Reservierung. Verbindlich wird sie erst mit unserer Bestätigung.

Bis bald, dein DOA-Team${footerText}`,
  });
}

/** Mail 2: the table is booked. */
export async function sendGuestConfirmed(details: ReservationDetails): Promise<void> {
  await send({
    to: details.email,
    replyTo: process.env.RESERVATION_NOTIFICATION_TO,
    subject: "Dein Tisch im Café DOA ist reserviert",
    html: layout(`
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#221d16;">Hallo ${escapeHtml(details.name)},</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#221d16;">
        dein Tisch ist reserviert – wir freuen uns auf dich!
      </p>
      ${detailBlock(details)}
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#221d16;">
        Du findest uns in der ${escapeHtml(CAFE_INFO.street)} in ${escapeHtml(CAFE_INFO.city)}
        (<a href="${CAFE_INFO.mapsUrl}" style="color:#bd6a3f;">Karte öffnen</a>).
        Solltest du es doch nicht schaffen, ruf uns bitte kurz an:
        <a href="tel:${CAFE_INFO.phoneHref}" style="color:#bd6a3f;text-decoration:none;">${escapeHtml(CAFE_INFO.phoneDisplay)}</a>.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#221d16;">Bis bald, dein DOA-Team</p>`),
    text: `Hallo ${details.name},

dein Tisch ist reserviert – wir freuen uns auf dich!

${formatDateTime(details.date, details.time)} · ${partyLabel(details.partySize)}

Du findest uns in der ${CAFE_INFO.street} in ${CAFE_INFO.city}. Solltest du es doch nicht schaffen, ruf uns bitte kurz an: ${CAFE_INFO.phoneDisplay}.

Bis bald, dein DOA-Team${footerText}`,
  });
}

/**
 * Mail 3: the request cannot be honoured. Also covers a booking cancelled
 * later - a guest who hears nothing turns up to a table that is not there.
 */
export async function sendGuestDeclined(
  details: ReservationDetails,
  reason: "declined" | "cancelled",
): Promise<void> {
  const when = formatDateTime(details.date, details.time);
  const lead =
    reason === "declined"
      ? `leider können wir deine Anfrage für ${when} nicht bestätigen – zu dieser Zeit sind wir bereits ausgebucht.`
      : `leider müssen wir deine Reservierung für ${when} kurzfristig stornieren. Das tut uns sehr leid.`;

  await send({
    to: details.email,
    replyTo: process.env.RESERVATION_NOTIFICATION_TO,
    subject:
      reason === "declined"
        ? "Zu deiner Reservierungsanfrage im Café DOA"
        : "Deine Reservierung im Café DOA",
    html: layout(`
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#221d16;">Hallo ${escapeHtml(details.name)},</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#221d16;">${escapeHtml(lead)}</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#221d16;">
        Ruf uns gerne an, wir finden bestimmt einen anderen Termin:
        <a href="tel:${CAFE_INFO.phoneHref}" style="color:#bd6a3f;text-decoration:none;">${escapeHtml(CAFE_INFO.phoneDisplay)}</a>.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#221d16;">Viele Grüße, dein DOA-Team</p>`),
    text: `Hallo ${details.name},

${lead}

Ruf uns gerne an, wir finden bestimmt einen anderen Termin: ${CAFE_INFO.phoneDisplay}.

Viele Grüße, dein DOA-Team${footerText}`,
  });
}
