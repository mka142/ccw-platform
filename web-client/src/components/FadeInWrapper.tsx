import { useState, useEffect } from "react";

import { useSpring, animated } from "react-spring";


// Wrapper component for entrance/exit animations
interface FadeInWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function FadeInWrapper({
  children,
  className,
}: FadeInWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);

  const fadeIn = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "scale(1)" : "scale(0.95)",
    config: {
      tension: 60,
      friction: 26,
    },
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <animated.div className={className} style={fadeIn}>
      {children}
    </animated.div>
  );
}
