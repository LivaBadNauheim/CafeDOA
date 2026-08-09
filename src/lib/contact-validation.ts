import { promises as dns } from "node:dns";
// The "max" metadata set is what carries number types; the default build
// reports every number as type undefined, which would let premium-rate and
// service numbers through.
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

/**
 * Domains reserved by RFC 2606/6761 for documentation and testing. They can
 * never receive mail.
 */
const RESERVED_DOMAINS = new Set(["example.com", "example.net", "example.org"]);
const RESERVED_TLDS = ["test", "invalid", "example", "localhost", "local"];

/** Throwaway inbox providers - a reservation sent there reaches nobody. */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.de",
  "mailinator.com",
  "maildrop.cc",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "trashmail.de",
  "wegwerfemail.de",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "mytemp.email",
  "moakt.com",
  "einrot.com",
  "fakeinbox.com",
]);

/** Local parts that are placeholders rather than real mailboxes. */
const PLACEHOLDER_LOCAL_PARTS = new Set([
  "test",
  "tester",
  "testing",
  "beispiel",
  "muster",
  "mustermann",
  "maxmustermann",
  "erikamustermann",
  "asdf",
  "qwertz",
  "qwerty",
  "abc",
  "xxx",
  "aaa",
  "niemand",
  "keine",
  "keineahnung",
  "nobody",
  "noreply",
  "no-reply",
  "donotreply",
  "du",
  "dein",
  "deine",
  "deinname",
  "email",
  "mail",
  "fake",
]);

/**
 * Providers common enough in Germany that a near-miss is almost certainly a
 * typo rather than a different domain.
 */
const COMMON_PROVIDERS = [
  "gmail.com",
  "googlemail.com",
  "web.de",
  "gmx.de",
  "gmx.net",
  "hotmail.com",
  "hotmail.de",
  "outlook.com",
  "outlook.de",
  "yahoo.com",
  "yahoo.de",
  "t-online.de",
  "icloud.com",
  "me.com",
  "aol.com",
  "freenet.de",
  "posteo.de",
  "mailbox.org",
];

/**
 * Damerau-Levenshtein distance, capped for early exit. Unlike plain
 * Levenshtein it counts a swap of neighbouring characters as one edit, which
 * is what makes "gmial.com" read as one typo away from "gmail.com".
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  const rows: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

function likelyTypoOf(domain: string): string | null {
  for (const provider of COMMON_PROVIDERS) {
    if (domain === provider) return null;
    if (editDistance(domain, provider, 1) <= 1) return provider;
  }
  return null;
}

// Deliberately stricter than the RFC: no quoted local parts, no consecutive
// dots, and a TLD of at least two letters.
const EMAIL_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export type ValidationResult = { ok: true; value: string } | { ok: false; error: string };

const GENERIC_EMAIL_ERROR = "Bitte gib eine gültige E-Mail-Adresse an.";

/**
 * Checks everything about an address that can be judged without sending mail:
 * shape, reserved and throwaway domains, and obvious placeholders. Whether the
 * mailbox actually belongs to the guest is only ever proven by the
 * confirmation mail arriving.
 */
export function validateEmailShape(rawEmail: string): ValidationResult {
  const email = rawEmail.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: GENERIC_EMAIL_ERROR };
  if (email.length > 254) return { ok: false, error: GENERIC_EMAIL_ERROR };

  const atIndex = email.lastIndexOf("@");
  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const domainLabels = domain.split(".");
  const tld = domainLabels[domainLabels.length - 1];

  if (RESERVED_DOMAINS.has(domain) || RESERVED_TLDS.includes(tld)) {
    return { ok: false, error: "Diese E-Mail-Adresse existiert nicht. Bitte gib deine echte Adresse an." };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, error: "Wegwerf-Adressen können wir leider nicht annehmen." };
  }

  // "du@du.de", "test@test.de", "a@a.de": repeating the domain name in front
  // of the @ is a placeholder pattern, not a mailbox someone reads.
  const normalizedLocal = localPart.replace(/[._-]/g, "");
  if (normalizedLocal === domainLabels[0]) {
    return { ok: false, error: "Bitte gib deine echte E-Mail-Adresse an." };
  }

  if (PLACEHOLDER_LOCAL_PARTS.has(normalizedLocal)) {
    return { ok: false, error: "Bitte gib deine echte E-Mail-Adresse an." };
  }

  // A single character before the @ is never a real, reachable mailbox in
  // practice, and is the most common way of filling the field in carelessly.
  if (normalizedLocal.length < 2) {
    return { ok: false, error: "Bitte gib deine echte E-Mail-Adresse an." };
  }

  const typo = likelyTypoOf(domain);
  if (typo) {
    return { ok: false, error: `Meintest du @${typo}? Bitte überprüfe deine E-Mail-Adresse.` };
  }

  return { ok: true, value: email };
}

/**
 * Confirms the domain can actually receive mail. Network failures resolve to
 * "accepted": a DNS hiccup must not cost the café a booking.
 */
export async function emailDomainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.slice(email.lastIndexOf("@") + 1);

  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    if (records.length > 0) return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // A domain that definitively does not exist is a typo worth rejecting.
    if (code === "ENOTFOUND" || code === "NXDOMAIN") return false;
    // Anything else (timeout, SERVFAIL, no MX) falls through to the A-record
    // check below, since some small domains accept mail without an MX record.
    if (code !== "ENODATA") return true;
  }

  try {
    const addresses = await Promise.race([
      dns.resolve4(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    return addresses.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validates against the real German numbering plan rather than counting
 * characters, so "0000000000" and "123456" are rejected while a genuine
 * mobile or landline number passes. Returns the number in E.164 form.
 */
export function validatePhone(rawPhone: string): ValidationResult {
  const phone = rawPhone.trim();
  const error = "Bitte gib eine gültige Telefonnummer an, unter der wir dich erreichen.";

  if (!/^[0-9+()/.\-\s]+$/.test(phone)) return { ok: false, error };

  const parsed = parsePhoneNumberFromString(phone, "DE");
  if (!parsed || !parsed.isValid()) return { ok: false, error };

  // Allowlist rather than denylist: only number types a guest can personally
  // be reached on. Premium-rate, shared-cost, toll-free and pager numbers all
  // fall through to the error.
  const type = parsed.getType();
  const reachable = type === "MOBILE" || type === "FIXED_LINE" || type === "FIXED_LINE_OR_MOBILE";
  if (!reachable) {
    return {
      ok: false,
      error: "Bitte gib eine Festnetz- oder Mobilnummer an, unter der wir dich erreichen.",
    };
  }

  return { ok: true, value: parsed.number };
}
