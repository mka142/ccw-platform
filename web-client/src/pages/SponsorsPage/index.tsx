import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

// Import sponsor logos
import amklLogo from "@/public/logo/amkl.png";
import kannmLogo from "@/public/logo/kannm.png";
import knakitmLogo from "@/public/logo/knakitm.png";
import sknmLogo from "@/public/logo/sknm.png";
import wcaLogo from "@/public/logo/wca-v2-cropped.png";
import wroclawLogo from "@/public/logo/wroclaw.png";

interface Sponsor {
  name: string;
  logo: string;
  width?: number;
}

const sponsors: Sponsor[] = [
  { name: "AMKL", logo: amklLogo, width: 300 },
  { name: "KNAKITM", logo: knakitmLogo, width: 300 },
  { name: "WCA", logo: wcaLogo, width: 300 },
  { name: "KANNM", logo: kannmLogo, width: 300 },
  { name: "SKNM", logo: sknmLogo, width: 170 },
  { name: "Wrocław", logo: wroclawLogo, width: 300 },
];

export default function SponsorsPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);

  useBackgroundColor(config.constants.pagesBackgroundColor.BEFORE_CONCERT, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSponsorIndex((prev) => (prev + 1) % sponsors.length);
    }, 5000); // Change sponsor every 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (shouldTransitionBegin) {
      setTransitionFinished();
    }
  }, [shouldTransitionBegin, setTransitionFinished]);

  const currentSponsor = sponsors[currentSponsorIndex];

  return (
    <div className="page-screen center bg-white flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSponsorIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          <img
            src={currentSponsor.logo}
            alt={currentSponsor.name}
            className="select-none pointer-events-none touch-none max-w-[80vw] max-h-[80vh] object-contain"
            style={{
              width: currentSponsor.width ? `${currentSponsor.width}px` : "auto",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
