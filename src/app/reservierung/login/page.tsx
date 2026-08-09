import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Anmeldung – Café DOA Reservierungen",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/reservierung");
  }

  return <LoginForm configured={supabase !== null} />;
}
