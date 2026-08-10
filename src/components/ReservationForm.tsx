"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitReservation, type ReservationState } from "@/app/actions/reservation";
import { CAFE_INFO } from "@/lib/cafe-info";
import { bookableTimeSlots, bookingWindowLabel, latestBookableDate } from "@/lib/opening-hours";
import { CheckIcon } from "./icons";

const initialState: ReservationState = { status: "idle" };

const inputClasses =
  "w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-ink placeholder:text-ink-soft/50 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20";

const labelClasses = "text-sm font-medium text-ink-soft";

export default function ReservationForm() {
  const [state, formAction, pending] = useActionState(submitReservation, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  const today = new Date().toISOString().slice(0, 10);
  const timeSlots = bookableTimeSlots();
  const latestDate = latestBookableDate();

  return (
    <section id="reservierung" className="bg-green py-16 text-cream sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Tisch reservieren
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-cream/80">
            Sag uns, wann du kommen willst. Wir schauen drüber und schicken dir
            die Bestätigung per Mail.
          </p>
          <p className="mt-6 text-sm text-cream/70">{CAFE_INFO.openingHours}</p>
          <p className="mt-1 text-sm text-cream/70">{bookingWindowLabel}</p>
          <p className="mt-1 text-sm text-cream/70">
            Lieber direkt anrufen?{" "}
            <a href={`tel:${CAFE_INFO.phoneHref}`} className="underline decoration-terracotta-light">
              {CAFE_INFO.phoneDisplay}
            </a>
          </p>
        </div>

        <form
          ref={formRef}
          action={formAction}
          noValidate
          className="rounded-3xl bg-cream p-6 text-ink shadow-xl shadow-ink/10 sm:p-8"
        >
          {/* Honeypot - hidden from real visitors */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company">Firma</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className={labelClasses}>Name</label>
              <input id="name" name="name" type="text" required className={inputClasses} placeholder="Vor- und Nachname" />
              {errors.name && <p className="text-sm text-terracotta">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className={labelClasses}>Telefon</label>
              <input id="phone" name="phone" type="tel" required className={inputClasses} placeholder="0173 1234567" />
              {errors.phone && <p className="text-sm text-terracotta">{errors.phone}</p>}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="email" className={labelClasses}>E-Mail</label>
              <input id="email" name="email" type="email" required className={inputClasses} placeholder="du@beispiel.de" />
              {errors.email && <p className="text-sm text-terracotta">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className={labelClasses}>Datum</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                min={today}
                max={latestDate}
                className={inputClasses}
              />
              {errors.date && <p className="text-sm text-terracotta">{errors.date}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="time" className={labelClasses}>Uhrzeit</label>
              <select id="time" name="time" required defaultValue="" className={inputClasses}>
                <option value="" disabled>
                  Bitte wählen
                </option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} Uhr
                  </option>
                ))}
              </select>
              {errors.time && <p className="text-sm text-terracotta">{errors.time}</p>}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="partySize" className={labelClasses}>Personenanzahl</label>
              <input
                id="partySize"
                name="partySize"
                type="number"
                min={1}
                max={20}
                defaultValue={2}
                required
                className={inputClasses}
              />
              {errors.partySize && <p className="text-sm text-terracotta">{errors.partySize}</p>}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="message" className={labelClasses}>Nachricht (optional)</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className={inputClasses}
                placeholder="Allergien, Kinderstuhl, Geburtstag ..."
              />
              {errors.message && <p className="text-sm text-terracotta">{errors.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Wird gesendet …" : "Reservierung anfragen"}
          </button>

          {state.status === "success" && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-green/10 px-4 py-3 text-sm text-green">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {state.message}
            </p>
          )}
          {state.status === "error" && state.message && (
            <p className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {state.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
