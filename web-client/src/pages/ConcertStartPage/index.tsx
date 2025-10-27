import ConcertProgram from "@/components/ConcertProgram";
import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

export default function ConcertStartPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  useBackgroundColor(config.constants.pagesBackgroundColor.CONCERT_START, 0);

  return (
    <FadeOutWrapper
      className="page-screen center"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className="w-full h-full">
        <ConcertProgram 
          payload={payload} 
          backgroundClassName="page-dark" 
          darkFont={false} 
        />
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
