import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import {
  TENSION_RECORDER_CONTAINER_CLASSES,
  TensionRecorder,
} from "@/components/TensionRecorder";
import config from "@/config";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";

export default function SliderDemoPage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  const [confettiActive, setConfettiActive] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useBackgroundColor(config.constants.pagesBackgroundColor.SLIDER_DEMO, 0);

  return (
    <FadeOutWrapper
      className={TENSION_RECORDER_CONTAINER_CLASSES}
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className={TENSION_RECORDER_CONTAINER_CLASSES}>
        {!showDemo ? (
          <div className="flex flex-col text-center justify-center items-center w-full h-full max-w-2xl mx-auto px-6">
            <h1 className="text-3xl font-bold text-white mb-8">
              Instrukcja obsługi suwaka napięcia
            </h1>

            <div className="space-y-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6"
              >
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Jak mierzyć napięcie?
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  W czasie trwania każdego z utworów, będzie wyświetlony suwak.
                  Będzie on rejestrował Twoje odczucia napięcia w czasie
                  rzeczywistym. W trakcie słuchania muzyki, przesuwaj suwak w
                  górę, gdy poczujesz wzrost napięcia, oraz w dół, gdy napięcie
                  będzie malało.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6"
              >
                <div className="text-4xl mb-4">👆</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Intuicyjny pomiar
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  Nie ma złych odpowiedzi! Reaguj naturalnie na muzykę. Twoje
                  odczucia są cenne dla naszego badania.
                </p>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDemo(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg"
            >
              Wypróbuj suwak
            </motion.button>
          </div>
        ) : (
          <div className="w-full h-full">
            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={() => setShowDemo(false)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                ← Powrót do instrukcji
              </button>
            </div>
            <TensionRecorder
              currentTimeMs={() => Date.now()}
              onComplete={(points) => {}}
              onSample={(s) => (s.v >= 90 ? setConfettiActive(true) : null)}
            />
            {confettiActive && (
              <Confetti recycle={false} numberOfPieces={300} />
            )}
          </div>
        )}
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
