import React, { useEffect, useState } from "react";
import TextArc from "@/components/TextArc/TextArc";

import logo from "@/public/logo/logo.svg";
import "../../orange-bg.css";
import "./main.css";
import type { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import ConcertProgram from "@/components/ConcertProgram";
import AppGuide from "@/components/AppGuide";
import ConcertForm from "@/components/ConcertForm";
import SponsorsCarousel from "@/components/SponsorsCarousel";
import Button from "@/components/Button";
import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

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

export default function BeforeConcertPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  const [pageType, setPageType] = useState<
    "NoteLoader" | "ConcertProgram" | "AppGuide" | "ConcertForm"
  >("NoteLoader");
  const [nextPageType, setNextPageType] = useState<
    "ConcertProgram" | "AppGuide" | "ConcertForm" | null
  >(null);
  const [formCompleted, setFormCompleted] = useState(false);
  const [internalShouldTransitionBegin, setInternalShouldTransitionBegin] =
    useState(false);

  useBackgroundColor(config.constants.pagesBackgroundColor.BEFORE_CONCERT, 0);

  // Handler for form submission
  const handleFormSubmitted = () => {
    setFormCompleted(true);
    setNextPageType(null);
    setPageType("NoteLoader");
    setInternalShouldTransitionBegin(false);
  };

  if (pageType === "NoteLoader") {
    return (
      <FadeInWrapper className="page-screen center orange-bg">
        <div className="page-screen center orange-bg">
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 right-4 px-10">
            <FormButton
              onClick={() => setPageType("ConcertForm")}
              completed={formCompleted}
            />

            <ProgramButton
              onClick={() => setPageType("ConcertProgram")}
              disabled={!formCompleted}
            />
            <AboutEventButton
              onClick={() => setPageType("AppGuide")}
              disabled={!formCompleted}
            />
          </div>
          <AwaitingContent
            shouldTransitionBegin={shouldTransitionBegin}
            setTransitionFinished={setTransitionFinished}
          />
        </div>
      </FadeInWrapper>
    );
  }

  if (pageType === "ConcertProgram") {
    return (
      <div className="flex flex-row">
        <ConcertProgram
          payload={payload}
          backgroundClassName="orange-bg"
          darkFont={true}
          fotter={
            <Button
              className="my-2"
              onClick={() => setPageType("NoteLoader")}
              variant="secondary"
            >
              Powrót
            </Button>
          }
        />
      </div>
    );
  }
  if (pageType === "AppGuide") {
    return <AppGuidePage onGoBack={() => setPageType("NoteLoader")} />;
  }
  if (pageType === "ConcertForm") {
    return <ConcertFormPage onFormSubmitted={handleFormSubmitted} />;
  }
}

function AppGuidePage({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="page-screen center orange-bg flex items-center justify-center">
      <FadeInWrapper className="w-full h-full flex flex-col items-center justify-center">
        <AppGuide />
        <Button
          className="my-2 self-start mx-4"
          onClick={onGoBack}
          variant="secondary"
        >
          Powrót
        </Button>
      </FadeInWrapper>
    </div>
  );
}

function ConcertFormPage({ onFormSubmitted }: { onFormSubmitted: () => void }) {
  return (
    <div className="page-screen orange-bg w-full h-full ">
      <FadeInWrapper className="w-full h-full flex items-center justify-center">
        <ConcertForm onFormSubmitted={onFormSubmitted} />
      </FadeInWrapper>
    </div>
  );
}

function AwaitingContent({
  shouldTransitionBegin,
  setTransitionFinished,
}: {
  shouldTransitionBegin: boolean;
  setTransitionFinished: (finished: boolean) => void;
}) {
  const [imageLoaded, setimageLoaded] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [showArc, setShowArc] = useState(false);
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
  }, [showRotate, showArc, arcText]);

  useEffect(() => {
    if (shouldTransitionBegin) {
      setTimeout(() => {
        setTransitionFinished(true);
      }, 5000);
    }
  }, [shouldTransitionBegin, setTransitionFinished]);

  return (
    <>
      <TextArc
        text={arcText}
        spread={0}
        fontSize={8}
        radius={28}
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
        } bg-card/20 backdrop-blur-sm w-[220px] h-[220px] rounded-full flex items-center justify-center text-card-foreground border shadow-sm
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
      <div className="absolute bottom-10 -z-10">
        <SponsorsCarousel />
      </div>
    </>
  );
}

function ProgramButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button className="whitespace-nowrap" onClick={onClick} disabled={disabled}>
      Program koncertu
    </Button>
  );
}

function AboutEventButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      className="whitespace-nowrap"
      onClick={onClick}
      variant="secondary"
      disabled={disabled}
    >
      O Wydarzeniu
    </Button>
  );
}

function FormButton({
  onClick,
  completed,
}: {
  onClick: () => void;
  completed: boolean;
}) {
  return (
    <Button
      className="whitespace-nowrap flex items-center gap-2 justify-center"
      onClick={onClick}
      disabled={completed}
      variant="primary"
    >
      {completed && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      Wypełnij formularz
    </Button>
  );
}
