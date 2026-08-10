import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream py-16 sm:py-24">
        <article className="mx-auto max-w-2xl px-5 sm:px-8">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
          <div className="legal mt-10">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
