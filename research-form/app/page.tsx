"use client";
import FloatingMusicSigns from "./components/FloatingMusicSigns";
import "./page.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  // AnimatePresence ensures exit animation runs
  return (
    <main>
      <AnimatePresence>
        {!leaving && (
          <motion.section
            className="section text-primary dark:text-primary bg-background"
            initial={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -80,
              transition: { duration: 0.7, ease: "easeInOut" },
            }}
          >
            <Container>
              <motion.div
                className="flex gap-7 max-w-[800px] flex-col items-start"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: -60,
                  transition: { duration: 0.6, ease: "easeInOut" },
                }}
              >
                <h1 className="pageTitle">Co czują Wrocławianie?</h1>
                <p className="pageSubtitle text-primary dark:text-white">
                  Badanie odbioru napięcia w muzyce podczas koncertu przy użyciu
                  wielomodalnego systemu ciągłej akwizycji i synchronizacji
                  percepcji muzycznej publiczności
                </p>
                <div className="pageDescription  text-primary dark:text-white/80 text-sm pt-3 font-light">
                  <p>
                    Słuchanie muzyki związane jest z analizą wielu komponentów
                    dźwiękowych. W każdej chwili doświadczamy relacji, jakie
                    zachodzą między wszystkimi elementami dzieła muzycznego.
                    Aspekty te mogą się ze sobą łączyć w czasie, wpływając na
                    kształt i zmienność utworu. Ta zmienność jest kluczowa dla
                    bezpośredniego odbioru i postrzegania napięcia muzycznego.
                  </p>
                </div>
                <button
                  className="border border-none rounded-xl bg-orange-800 px-6 py-3 hover:bg-orange-600  text-white transition-colors font-sans font-semibold hover:shadow-2xl hover:cursor-pointer"
                  onClick={() => {
                    setLeaving(true);
                    setTimeout(() => router.push("/form"), 700);
                  }}
                >
                  Wypełnij formularz
                </button>
              </motion.div>
            </Container>
            <FloatingMusicSigns />
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
/* Container layout */

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full mx-auto px-4 sm:max-w-[var(--container-sm)] md:max-w-[var(--container-md)] lg:max-w-[var(--container-lg)] xl:max-w-[var(--container-xl)] sm:px-8 md:px-8">
      {children}
    </div>
  );
}

{
  /* <div className="hero-graphics">
              <div className="floating-note note-1">♪</div>
              <div className="floating-note note-2">♫</div>
              <div className="floating-note note-3">♩</div>
              <div className="floating-clef">𝄞</div>
            </div> */
}
