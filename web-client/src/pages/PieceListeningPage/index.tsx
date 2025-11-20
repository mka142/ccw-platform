import React, { useEffect } from "react";
import type { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import Logo from "@/components/Logo";

export default function PieceListeningPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  useBackgroundColor("#000000", 0);

  useEffect(() => {
    if (shouldTransitionBegin) {
      setTransitionFinished();
    }
  }, [shouldTransitionBegin, setTransitionFinished]);

  return (
    <div className="page-screen center bg-black flex items-center justify-center">
      <Logo
        size={120}
        fill="#666666"
        className="select-none pointer-events-none touch-none"
      />
    </div>
  );
}
