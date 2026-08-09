"use server";

import { z } from "zod";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { sendReservationNotification } from "@/lib/email";

const reservationSchema = z.object({
  name: z.string().trim().min(2, "Bitte gib deinen Namen an."),
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse an."),
  phone: z
    .string()
    .trim()
    .min(6, "Bitte gib eine gültige Telefonnummer an.")
    .regex(/^[0-9+()/\-\s]+$/, "Bitte gib eine gültige Telefonnummer an."),
  date: z
    .string()
    .trim()
    .refine((value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "Bitte wähle ein Datum ab heute."),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Bitte wähle eine gültige Uhrzeit."),
  partySize: z.coerce.number().int().min(1, "Mindestens 1 Person.").max(20, "Für größere Gruppen bitte anrufen."),
  message: z.string().trim().max(500, "Nachricht ist zu lang.").optional().or(z.literal("")),
  // honeypot field - real visitors never fill this in
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ReservationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitReservation(
  _prevState: ReservationState,
  formData: FormData,
): Promise<ReservationState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    time: formData.get("time"),
    partySize: formData.get("partySize"),
    message: formData.get("message") ?? "",
    company: formData.get("company") ?? "",
  };

  const parsed = reservationSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      status: "error",
      message: "Bitte überprüfe deine Angaben.",
      fieldErrors,
    };
  }

  // Honeypot tripped: pretend success, do nothing.
  if (parsed.data.company) {
    return { status: "success" };
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

  const { name, email, phone, date, time, partySize, message } = parsed.data;

  const { error } = await supabase.from("reservations").insert({
    name,
    email,
    phone,
    reservation_date: date,
    reservation_time: time,
    party_size: partySize,
    message: message || null,
  });

  if (error) {
    return {
      status: "error",
      message: "Die Reservierung konnte nicht gesendet werden. Bitte versuche es später erneut oder ruf uns an.",
    };
  }

  // Best-effort notification: the request is already stored, so a failure
  // here must not surface as an error to the guest.
  await sendReservationNotification({ name, email, phone, date, time, partySize, message: message || undefined });

  return {
    status: "success",
    message: "Danke für deine Anfrage! Wir melden uns telefonisch oder per E-Mail zur Bestätigung.",
  };
}
