import React from "react";
import { motion } from "framer-motion";

import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { Piece } from "@/components/Piece";
import { PieceData } from "@/types";
import { AnimatedPage } from "@/components/AnimatedPage";

export default function PieceAnnouncementPage({
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  return (
    <AnimatedPage
      title="Kolejny utwór"
      onTransitionFinished={setTransitionFinished}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.6,
          ease: "easeOut",
        }}
        className="group mb-8"
      >
        <div className="group-hover:shadow-2xl transition-shadow duration-200">
          <Piece {...(payload as PieceData)} />
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
