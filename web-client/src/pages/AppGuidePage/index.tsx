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
        <h1 className="text-4xl font-bold text-white mb-8">Dear Listener</h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
          <span className="text-lg text-white/90 leading-relaxed mb-3">
            Before starting the research concert, please familiarize yourself with
            the following guidelines that will help you fully enjoy the
            musical experience.
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
              Remember to silence your phone
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
              Try to reduce screen brightness
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
                Turn off vibrations on your phone
              </p>
            </div>
            <div className="text-xs text-white/80 space-y-1">
              <div>
                <strong>iPhone:</strong> Settings › Accessibility › Touch ›
                Vibration (turn off)
              </div>
              <div>
                <strong>Android:</strong> Settings › Sounds and vibrations ›
                Mute
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
                Don't exit the app during the concert
              </p>
            </div>
            <div className="text-xs text-white/80 space-y-1">
              Entering and exiting the app may cause disruptions to its
              operation and affect the quality of collected data.
            </div>
          </motion.div>
        </div>
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
