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
import {
  useBackgroundColor,
  useBackgroundColorSetter,
} from "@/hooks/useBackgroundColor";
import config from "@/config";
import { useUserResponseExist } from "@/components/form/useUserResponseExist";
import ResearchForm, { FORM_ID } from "@/components/form/ResearchForm";

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
  const [formCompleted, setFormCompleted] = useState(false);
  const { exist } = useUserResponseExist(FORM_ID);

  useBackgroundColor(config.constants.pagesBackgroundColor.BEFORE_CONCERT, 0);

  useEffect(() => {
    if (exist) {
      setFormCompleted(true);
    }
  }, [exist]);

  useEffect(() => {
    if (shouldTransitionBegin && pageType !== "NoteLoader") {
      setPageType("NoteLoader");
    }
  }, [shouldTransitionBegin, pageType]);

  // Handler for form submission
  const handleFormSubmitted = () => {
    setFormCompleted(true);
    setPageType("NoteLoader");
  };

  if (pageType === "NoteLoader") {
    return (
      <FadeInWrapper className="page-screen center orange-bg">
        <div className="page-screen center orange-bg">
          <div className="absolute top-4 left-4 right-4">
            <div className="relative  flex flex-col gap-2 px-10">
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
      <div className="flex flex-row relative w-full h-full p-6 box-border touch-manipulation overflow-y-auto">
        <ConcertProgram
          payload={payload}
          backgroundClassName="orange-bg"
          darkFont={true}
          fotter={
            <Button
              className="my-6"
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
    return (
      <ConcertFormPage
        onFormSubmitted={handleFormSubmitted}
        onCancel={() => setPageType("NoteLoader")}
      />
    );
  }
}

function AppGuidePage({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="page-screen center orange-bg flex items-center justify-center">
      <FadeInWrapper className="relative w-full h-full p-6 box-border touch-manipulation overflow-y-auto">
        <AppGuide
          footer={
            <>
              <Button
                className="mb-4 self-start mx-4"
                onClick={onGoBack}
                variant="secondary"
              >
                Powrót
              </Button>
              <div className="h-4"></div>
            </>
          }
        />
      </FadeInWrapper>
    </div>
  );
}

function ConcertFormPage({
  onFormSubmitted,
  onCancel,
}: {
  onFormSubmitted: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="orange-bg page-screen">
      <FadeInWrapper className="relative w-full h-full box-border touch-manipulation overflow-y-auto">
        <ConcertForm
          onFormSubmitted={onFormSubmitted}
          onCancel={onCancel}
          formComponent={ResearchForm}
          formId={FORM_ID}
        />
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

  useBackgroundColor("#000000", 5000, shouldTransitionBegin);

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
        className="absolute w-[480px] h-[480px] select-none -z-10"
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
          className={`select-none pointer-events-none touch-none h-[120px] w-[120px] z-100 ${
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
  const isCompleted = completed;

  return (
    <Button
      className="whitespace-nowrap flex items-center gap-2 justify-center"
      onClick={onClick}
      disabled={isCompleted}
      variant="primary"
    >
      {isCompleted && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            color="green"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      {isCompleted ? (
        <span className="line-through">Wypełniono formularz</span>
      ) : (
        <span>Wypełnij formularz</span>
      )}
    </Button>
  );
}
