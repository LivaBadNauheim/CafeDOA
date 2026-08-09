"use server";

import { z } from "zod";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { emailDomainAcceptsMail, validateEmailShape, validatePhone } from "@/lib/contact-validation";
import {
  OPENING_HOURS,
  bookableTimeSlots,
  cafeNow,
  isWithinOpeningHours,
  latestBookableDate,
  timeToMinutes,
} from "@/lib/opening-hours";

/** Shape only - the meaningful checks happen after parsing. */
const reservationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte gib deinen Namen an.")
    .max(100, "Bitte gib einen kürzeren Namen an."),
  email: z.string().trim().min(1, "Bitte gib eine E-Mail-Adresse an."),
  phone: z.string().trim().min(1, "Bitte gib eine Telefonnummer an."),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte wähle ein Datum."),
  time: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Bitte wähle eine Uhrzeit."),
  partySize: z.coerce
    .number()
    .int("Bitte gib eine ganze Zahl an.")
    .min(1, "Mindestens 1 Person.")
    .max(20, "Für Gruppen ab 21 Personen ruf uns bitte an."),
  message: z.string().trim().max(500, "Bitte fasse dich etwas kürzer.").optional().or(z.literal("")),
  // Honeypot field - real visitors never fill this in.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ReservationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function fieldError(field: string, error: string): ReservationState {
  return {
    status: "error",
    message: "Bitte überprüfe deine Angaben.",
    fieldErrors: { [field]: error },
  };
}

export async function submitReservation(
  _prevState: ReservationState,
  formData: FormData,
): Promise<ReservationState> {
  const parsed = reservationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    time: formData.get("time"),
    partySize: formData.get("partySize"),
    message: formData.get("message") ?? "",
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Bitte überprüfe deine Angaben.", fieldErrors };
  }

  // Honeypot tripped: pretend success, do nothing.
  if (parsed.data.company) return { status: "success" };

  const { name, date, time, partySize, message } = parsed.data;

  const email = validateEmailShape(parsed.data.email);
  if (!email.ok) return fieldError("email", email.error);

  const phone = validatePhone(parsed.data.phone);
  if (!phone.ok) return fieldError("phone", phone.error);

  if (!isWithinOpeningHours(time)) {
    return fieldError(
      "time",
      `Wir nehmen Reservierungen zwischen ${OPENING_HOURS.opensAt} und ${OPENING_HOURS.lastSlotAt} Uhr an.`,
    );
  }

  // Guests pick from a dropdown, so an off-grid time means the value was not
  // submitted through the form.
  if (!bookableTimeSlots().includes(time)) {
    return fieldError("time", "Bitte wähle eine der angebotenen Uhrzeiten.");
  }

  const now = cafeNow();
  if (date < now.date) {
    return fieldError("date", "Dieses Datum liegt in der Vergangenheit.");
  }
  if (date > latestBookableDate()) {
    return fieldError("date", "So weit im Voraus können wir leider noch nicht reservieren.");
  }
  if (date === now.date) {
    const slotMinutes = timeToMinutes(time) ?? 0;
    if (slotMinutes < now.minutes + OPENING_HOURS.minLeadMinutes) {
      return fieldError(
        "time",
        `Für heute brauchen wir mindestens ${OPENING_HOURS.minLeadMinutes} Minuten Vorlauf. Bitte wähle eine spätere Uhrzeit oder ruf uns an.`,
      );
    }
  }

  // Checked last: it is the only rule that costs a DNS round trip.
  if (!(await emailDomainAcceptsMail(email.value))) {
    return fieldError("email", "Diese E-Mail-Adresse konnten wir nicht zustellen. Bitte überprüfe sie.");
  }

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message:
        "Die Online-Reservierung ist gerade noch nicht angebunden. Bitte ruf uns unter 06032/7843278 an.",
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Die Reservierung konnte nicht gesendet werden. Bitte versuche es später erneut.",
    };
  }

  const { error } = await supabase.from("reservations").insert({
    name,
    email: email.value,
    phone: phone.value,
    reservation_date: date,
    reservation_time: time,
    party_size: partySize,
    message: message || null,
  });

  if (error) {
    // Guests get a generic message, but without the underlying cause in the
    // logs a failed insert is undiagnosable from the outside.
    console.error("Reservation insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      status: "error",
      message: "Die Reservierung konnte nicht gesendet werden. Bitte versuche es später erneut oder ruf uns an.",
    };
  }

  return {
    status: "success",
    message:
      "Danke für deine Anfrage! Wir prüfen sie und bestätigen dir deinen Tisch telefonisch oder per E-Mail.",
  };
}
