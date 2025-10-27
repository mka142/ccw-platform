import { useState, useEffect } from "react";

import { useSpring, animated } from "react-spring";

// Wrapper component for exit animations
interface FadeOutWrapperProps {
  children: React.ReactNode;
  className?: string;
  shouldTransitionBegin: boolean;
  setTransitionFinished: (finished: boolean) => void;
  speed?: number;
}

const getSpeed = (x: number) => ({
  tension: 60 * x,
  friction: 26 / x,
});

export default function FadeOutWrapper({
  children,
  className,
  shouldTransitionBegin,
  setTransitionFinished,
  speed = 1,
}: FadeOutWrapperProps) {
  const [isVisible, setIsVisible] = useState(true);

  const fadeOut = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "scale(1)" : "scale(0.95)",
    config: {
      ...getSpeed(speed),
    },
    onRest: () => {
      if (!isVisible) {
        setTransitionFinished(true);
      }
    },
  });

  useEffect(() => {
    if (shouldTransitionBegin) {
      setIsVisible(false);
    }
  }, [shouldTransitionBegin]);

  return (
    <animated.div className={className} style={fadeOut}>
      {children}
    </animated.div>
  );
}
