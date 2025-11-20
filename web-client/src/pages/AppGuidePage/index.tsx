import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import { motion } from "framer-motion";
import config from "@/config";

export default function AppGuidePage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  useBackgroundColor(config.constants.pagesBackgroundColor.APP_GUIDE, 0);

  return (
    <FadeOutWrapper
      className="page-screen center"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className="w-full h-full flex flex-col items-center justify-start overflow-auto py-12 px-4 text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-white mb-8">Drogi Słuchaczu</h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
          <span className="text-lg text-white/90 leading-relaxed mb-3">
            Przed rozpoczęciem koncertu badawczego, prosimy o zapoznanie się z
            poniższymi wskazówkami, które pomogą Ci w pełni cieszyć się
            doświadczeniem muzycznym.
          </span>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4"
          >
            <div className="text-2xl">🔇</div>
            <p className="text-white text-sm font-medium">
              Pamiętaj o wyciszeniu telefonu
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4"
          >
            <div className="text-2xl">🔆</div>
            <p className="text-white text-sm font-medium">
              Spróbuj zmniejszyć jasność ekranu
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
          >
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="text-2xl">📳</div>
              <p className="text-white text-sm font-medium">
                Wyłącz wibracje w telefonie
              </p>
            </div>
            <div className="text-xs text-white/80 space-y-1">
              <div>
                <strong>iPhone:</strong> Ustawienia › Dostępność › Dotyk ›
                Wibracja (wyłącz)
              </div>
              <div>
                <strong>Android:</strong> Ustawienia › Dźwięki i wibracje ›
                Wycisz
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8, ease: "easeOut" }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
          >
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="text-2xl">📱</div>

              <p className="text-white text-sm font-medium">
                W trakcie trwania koncertu nie wychodź z aplikacji
              </p>
            </div>
            <div className="text-xs text-white/80 space-y-1">
              Wchodzenie i wychodzenie z aplikacji może powodować zakłócenia w
              jej działaniu oraz wpływać na jakość zbieranych danych.
            </div>
          </motion.div>
        </div>
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
