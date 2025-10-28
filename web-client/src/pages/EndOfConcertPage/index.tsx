import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";
import SponsorsCarousel from "@/components/SponsorsCarousel";
import FeedbackForm, { FEEDBACK_FORM_ID } from "@/components/form/FeedbackForm";
import ConcertForm from "@/components/ConcertForm";
import { useEffect, useState } from "react";
import { useUserResponseExist } from "@/components/form/useUserResponseExist";
import Button from "@/components/Button";

export default function EndOfConcertPage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  const [pageType, setPageType] = useState("OpenFormPage");
  const [formCompleted, setFormCompleted] = useState(false);
  const { exist } = useUserResponseExist(FEEDBACK_FORM_ID);

  useBackgroundColor(
    config.constants.pagesBackgroundColor.END_OF_CONCERT,
    2000
  );

  useEffect(() => {
    if (exist) {
      setFormCompleted(true);
    }
  }, [exist]);

  useEffect(() => {
    if (formCompleted) {
      setPageType("GoodbyePage");
    }
  }, [formCompleted]);

  useEffect(() => {
    if (shouldTransitionBegin) {
      setTransitionFinished();
    }
  }, [shouldTransitionBegin, setTransitionFinished]);

  if (pageType === "OpenFormPage") {
    return <FormInfoPage setPageType={setPageType} />;
  }

  if (pageType === "ConcertFormPage") {
    return (
      <ConcertFormPage
        onFormSubmitted={() => setFormCompleted(true)}
        onCancel={() => setPageType("GoodbyePage")}
      />
    );
  }
  if (pageType === "GoodbyePage") {
    return <GoodbyePage />;
  }
}

function GoodbyePage() {
  return (
    <FadeInWrapper className="w-full h-full flex items-center justify-center ">
      <div className="w-full text-center space-y-8">
        <div className="p-8">
          <h1 className="text-5xl font-bold text-white mb-8">Dziękujemy!</h1>

          <div className="space-y-6 text-md text-white/90 leading-relaxed">
            <p>
              Dziękujemy za udział w koncercie badawczym i za podzielenie się
              swoimi odczuciami.
            </p>

            <p>
              Wasza obecność i zaangażowanie były dla nas niezwykle cenne.
              Zebrane dane pomogą nam lepiej zrozumieć, jak muzyka wpływa na
              emocje i doświadczenia słuchaczy.
            </p>

            <p className="text-2xl font-bold text-orange-300 mt-8">
              Do zobaczenia wkrótce!
            </p>
          </div>
        </div>
        <SponsorsCarousel />
      </div>
    </FadeInWrapper>
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
    <div className="page-screen">
      <FadeInWrapper className="relative w-full h-full box-border touch-manipulation overflow-y-auto">
        <ConcertForm
          onFormSubmitted={onFormSubmitted}
          onCancel={onCancel}
          formComponent={FeedbackForm}
          formId={FEEDBACK_FORM_ID}
        />
      </FadeInWrapper>
    </div>
  );
}

function FormInfoPage({
  setPageType,
}: {
  setPageType: (type: string) => void;
}) {
  return (
    <FadeInWrapper className="w-full h-full flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl font-bold text-white mb-6">
          Podziel się swoimi wrażeniami
        </h1>

        <p className="text-xl text-white/90 leading-relaxed">
          Twoja opinia jest dla nas bardzo ważna. Wypełnienie krótkiej ankiety
          pomoże nam lepiej zrozumieć Twoje doświadczenia z tego koncertu
          badawczego.
        </p>

        <div className="pt-6">
          <Button
            variant="primary"
            onClick={() => setPageType("ConcertFormPage")}
          >
            Otwórz formularz
          </Button>
        </div>
      </div>
    </FadeInWrapper>
  );
}
