import React, { useEffect, useState } from "react";
import TextArc from "../../TextArc/TextArc";

import logo from "../../logo.svg";
import "../../orange-bg.css";
import "./main.css";
import type { StateNavigationComponentProps } from "@/lib/StateNavigationContext";

export default function NoteLoader({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  const [imageLoaded, setimageLoaded] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [showArc, setShowArc] = useState(false);

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
  const [arcText, setArcText] = useState(TEXTS[TEXTS.length - 1]);

  // Handler for animation end
  const rotateNoteAfterCardAppears = () => {
    setTimeout(() => {
      setShowRotate(true);
    }, 500);
  };

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
    if (shouldTransitionBegin) {
      setTimeout(() => {
        setTransitionFinished();
      }, 5000);
    }
  }, [shouldTransitionBegin]);

  return (
    <div className="page-screen center orange-bg">
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
            !shouldTransitionBegin && showRotate ? " complex-rotate" : ""
          }
          ${shouldTransitionBegin ? " complex-rotate-transition" : ""} `}
          onLoad={() => setimageLoaded(true)}
          style={
            { "--rotate-transition-duration": "5s" } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
