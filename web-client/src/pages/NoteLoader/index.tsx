import React, { useEffect, useState } from "react";
import TextArc from "../../TextArc/TextArc";

import logo from "../../logo.svg";
import "../../orange-bg.css";
import "./main.css";
import type { StateNavigationComponentProps } from "@/lib/StateNavigationContext";
import ConcertProgram from "@/components/ConcertProgram";

const TEXTS = [
  "Co czują Wrocławianie?",
  "Jakie są ich emocje?",
  "Czy są szczęśliwi?",
  "Czy może są smutni?",
  "Jakiej słuchają muzyki?",
  "Jakie mają marzenia?",
  "Czy muzyka ich łączy?",
  "Kim są Wrocławianie?",
  "Co ich motywuje?",
  "Jakie mają pasje?",
  "Czy są twórczy?",
];

export default function NoteLoader({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  const [pageType, setPageType] = useState<"NoteLoader" | "ConcertProgram">(
    "NoteLoader"
  );
  const [imageLoaded, setimageLoaded] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [showArc, setShowArc] = useState(false);
  const [arcText, setArcText] = useState(TEXTS[TEXTS.length - 1]);
  const [internalTransitionBegin, setInternalTransitionBegin] = useState(false);

  // Handler for animation end
  const rotateNoteAfterCardAppears = () => {
    setTimeout(() => {
      setShowRotate(true);
    }, 500);
  };
  console.log(payload);

  useEffect(() => {
    // Handle arc text rotation
    if (!showRotate) return;

    if (!showArc) {
      const interval = setInterval(() => {
        setArcText(TEXTS[TEXTS.indexOf(arcText) + 1] || TEXTS[0]);
        setShowArc(true);
      }, 2000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setShowArc(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [showRotate, showArc]);

  useEffect(() => {
    if (shouldTransitionBegin || internalTransitionBegin) {
      setTimeout(() => {
        setTransitionFinished();
        if (internalTransitionBegin) setPageType("ConcertProgram");
      }, 1000);
    }
  }, [shouldTransitionBegin, internalTransitionBegin]);

  return pageType === "NoteLoader" ? (
    <div className="page-screen center orange-bg">
      <button
        className="absolute top-[56px] hover:cursor-pointer left-1/2 -translate-x-1/2 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 hover:border-white/40 active:scale-95"
        onClick={() => {
          setInternalTransitionBegin(true);
        }}
      >
        Program koncertu
      </button>
      <TextArc
        text={arcText}
        spread={0}
        fontSize={9}
        radius={30}
        textColor="hsl(0 100% 50% / 0.5)"
        className="absolute w-[480px] h-[480px]"
        visible={showArc}
        inside={false}
        rotate
        rotateDirection="left"
      />
      <div
        className={`${
          imageLoaded ? "loaded" : "initial"
        } bg-card/20 backdrop-blur-sm w-[240px] h-[240px] rounded-full flex items-center justify-center text-card-foreground border shadow-sm
        `}
        onAnimationEnd={rotateNoteAfterCardAppears}
      >
        <img
          src={logo}
          alt="Bun Logo"
          className={`h-[120px] w-[120px] z-10${
            !(shouldTransitionBegin || internalTransitionBegin) && showRotate
              ? " complex-rotate"
              : ""
          }
          ${
            shouldTransitionBegin || internalTransitionBegin
              ? " complex-rotate-transition"
              : ""
          } `}
          onLoad={() => setimageLoaded(true)}
          style={
            { "--rotate-transition-duration": "5s" } as React.CSSProperties
          }
        />
      </div>
    </div>
  ) : (
    <ConcertProgram payload={payload} />
  );
}
