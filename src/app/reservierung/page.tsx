import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cafeNow } from "@/lib/opening-hours";
import ReservationBoard, { type Reservation } from "./ReservationBoard";

export const metadata: Metadata = {
  title: "Reservierungen – Café DOA",
  robots: { index: false, follow: false },
};

// Always render fresh: a cached list of reservations would show the team
// stale bookings.
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/reservierung/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/reservierung/login");

  // Past days never reach the board - the team works forwards, and finished
  // bookings only get in the way.
  const now = cafeNow();

  const { data, error } = await supabase
    .from("reservations")
    .select("id, name, email, phone, reservation_date, reservation_time, party_size, message, status, created_at")
    .gte("reservation_date", now.date)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true })
    .limit(500);

  if (error) {
    console.error("Loading reservations failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  return (
    <ReservationBoard
      initialReservations={(data ?? []) as Reservation[]}
      today={now.date}
      nowTime={now.time}
      userEmail={user.email ?? ""}
      loadError={Boolean(error)}
    />
  );
}
