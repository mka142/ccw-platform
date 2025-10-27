import React from "react";
import { motion } from "framer-motion";

import { StateNavigationComponentProps } from "@/lib/StateNavigationContext";
import { Piece } from "@/components/Piece";
import { PieceData } from "@/types";
import { AnimatedPage } from "@/components/AnimatedPage";

export default function ConcertProgram({
  payload,
}: Pick<StateNavigationComponentProps, "payload">) {
  const pieces = (payload?.pieces as PieceData[]) || [];

  return (
    <AnimatedPage title={payload?.title} subtitle={payload?.subtitle}>
      {pieces.map((piece, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2 + i * 0.15,
            duration: 0.6,
            ease: "easeOut",
          }}
          className="group mb-8"
          style={{ cursor: "pointer" }}
        >
          <div className="group-hover:shadow-2xl transition-shadow duration-200">
            <Piece {...piece} />
          </div>
        </motion.div>
      ))}
    </AnimatedPage>
  );
}
