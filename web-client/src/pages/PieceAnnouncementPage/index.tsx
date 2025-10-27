import React from "react";
import { motion } from "framer-motion";

import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { Piece } from "@/components/Piece";
import { PieceData } from "@/types";
import AnimatedPage from "@/components/AnimatedPage";
import Logo from "@/components/Logo";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import config from "@/config";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";

export default function PieceAnnouncementPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  useBackgroundColor(
    config.constants.pagesBackgroundColor.PIECE_ANNOUNCEMENT,
    0
  );

  return (
    <FadeOutWrapper
      className="flex flex-col items-center justify-center w-full h-full"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <AnimatedPage
        title={
          <span className="flex flex-row items-start">
            <Logo className="w-8 h-8 my-auto mr-2" />
            <span>{payload.pieceTitle}</span>
          </span>
        }
        onTransitionFinished={() => {}}
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
          <div className="mt-4 text-gray-400 italic">
            {payload.pieceDescription}
          </div>
        </motion.div>
      </AnimatedPage>
    </FadeOutWrapper>
  );
}
