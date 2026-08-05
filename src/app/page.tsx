import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import MenuSection from "@/components/MenuSection";
import Gallery from "@/components/Gallery";
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
        <About />
        <MenuSection />
        <Gallery />
        <ReservationForm />
      </main>
      <Footer />
    </>
  );
}
