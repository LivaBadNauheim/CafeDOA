import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import Gallery from "@/components/Gallery";
import Instagram from "@/components/Instagram";
import ReservationForm from "@/components/ReservationForm";
import Footer from "@/components/Footer";

// Re-check the Supabase gallery bucket periodically so newly uploaded
// photos show up without needing a full redeploy.
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <MenuSection />
        <Gallery />
        <Instagram />
        <ReservationForm />
      </main>
      <Footer />
    </>
  );
}
