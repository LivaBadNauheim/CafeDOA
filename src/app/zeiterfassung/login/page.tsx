import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { angemeldet } from "@/lib/zeit-server";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Zeiterfassung – Café DOA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await angemeldet()) redirect("/zeiterfassung");
  return <LoginForm />;
}
