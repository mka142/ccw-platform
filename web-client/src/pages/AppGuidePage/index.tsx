import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import AppGuide from "@/components/AppGuide";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

export default function AppGuidePage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  useBackgroundColor(config.constants.pagesBackgroundColor.APP_GUIDE, 0);

  return (
    <FadeOutWrapper
      className="page-screen center"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className="w-full h-full flex items-center justify-center orange-bg">
        <AppGuide />
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
