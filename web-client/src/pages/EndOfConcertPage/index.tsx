import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

export default function EndOfConcertPage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  useBackgroundColor(config.constants.pagesBackgroundColor.END_OF_CONCERT, 0);

  return (
    <FadeOutWrapper
      className="page-screen center"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className="w-full h-full flex items-center justify-center p-8">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl font-bold text-white mb-8">
            Dziękujemy!
          </h1>

          <div className="space-y-6 text-xl text-white/90 leading-relaxed">
            <p>
              Dziękujemy za udział w koncercie badawczym i za podzielenie się
              swoimi odczuciami.
            </p>

            <p>
              Wasza obecność i zaangażowanie były dla nas niezwykle cenne.
              Zebrane dane pomogą nam lepiej zrozumieć, jak muzyka wpływa na
              emocje i doświadczenia słuchaczy.
            </p>

            <p className="text-2xl font-semibold text-orange-300 mt-8">
              Do zobaczenia wkrótce!
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-white/60">
              Akademia Muzyczna im. Karola Lipińskiego we Wrocławiu
            </p>
          </div>
        </div>
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
