import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import ButtonLink from "@/components/ButtonLink";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

export default function FeedbackFormPage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  useBackgroundColor(config.constants.pagesBackgroundColor.FEEDBACK_FORM, 0);

  return (
    <FadeOutWrapper
      className="page-screen center"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
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
            <ButtonLink
              href={config.api.baseUrl + "/form"}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
            >
              Otwórz formularz
            </ButtonLink>
          </div>

          <p className="text-sm text-white/60 mt-4">
            Formularz otworzy się w nowej karcie
          </p>
        </div>
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
