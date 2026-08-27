"use client";

import { useActionState } from "react";
import { anmelden, type LoginState } from "@/app/actions/zeit";
import { LOGIN_DOMAIN } from "@/lib/zeit";
import Logo from "@/components/Logo";

const anfang: LoginState = {};

export default function LoginForm() {
  const [state, formAction, laeuft] = useActionState(anmelden, anfang);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-green px-5 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 shadow-xl shadow-ink/20">
        <div className="flex justify-center text-ink">
          <Logo />
        </div>
        <h1 className="font-display mt-6 text-center text-2xl font-semibold text-ink">
          Zeiterfassung
        </h1>
        <p className="mt-2 text-center text-sm text-ink-soft">
          Anmeldename und Passwort bekommst du von der Leitung
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink-soft">
              Anmeldename
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoCapitalize="none"
              placeholder={`vorname.nachname@${LOGIN_DOMAIN}`}
              className="w-full rounded-xl border border-ink/15 bg-cream-soft px-4 py-3 text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="passwort" className="text-sm font-medium text-ink-soft">
              Passwort
            </label>
            <input
              id="passwort"
              name="passwort"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-ink/15 bg-cream-soft px-4 py-3 text-ink focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            />
          </div>

          {state.error && (
            <p className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={laeuft}
            className="mt-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {laeuft ? "Anmelden …" : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
