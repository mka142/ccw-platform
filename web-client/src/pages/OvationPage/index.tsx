import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import config from "@/config";

export default function OvationPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  useBackgroundColor(config.constants.pagesBackgroundColor.OVATION, 0);

  return (
    <FadeOutWrapper
      className="page-screen center"
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-lg font-bold text-white/80 mb-8">
            {payload.message}
          </h1>
          {/* Subtle visual indicator that the app is active */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse" />
            <div
              className="w-3 h-3 bg-white/40 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-3 h-3 bg-white/40 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
