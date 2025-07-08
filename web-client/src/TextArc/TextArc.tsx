import { useEffect, useMemo, useState } from "react";
import "./TextArc.css";

export default function TextArc({
  text,
  className,
  radius = 40,
  inside = false,
  spread = 0,
  fontSize = 12,
  rotate = false,
  rotateDirection = "right",
  visible = true,
}: {
  text?: string;
  className?: string;
  radius?: number;
  inside?: boolean;
  spread?: number;
  fontSize?: number;
  textColor?: string;
  rotate?: boolean;
  rotateDirection?: "left" | "right";
  visible?: boolean;
}) {
  const VIEWBOX = 100;

  const generateSVGPATH = ({
    radius,
    inside,
  }: {
    radius: number;
    inside?: boolean;
  }) => {
    const PATH = `
    M ${VIEWBOX * 0.5 - radius}, ${VIEWBOX * 0.5}
    a ${radius},${radius} 0 1,${inside ? 0 : 1} ${radius * 2},0
    ${radius},${radius} 0 1,${inside ? 0 : 1} -${radius * 2},0
  `;
    return PATH;
  };

  const getSVGPATH = useMemo(() => {
    return generateSVGPATH({
      radius,
      inside,
    });
  }, [radius, inside]);

  const spreadTextLength = useMemo(() => {
    return Math.floor(Math.PI * radius * 2);
  }, [radius]);

  const [transitioned, setTransitioned] = useState(false);

  // Handler for transition end
  const handleTransitionEnd = () => {
    console.log("Transition ended", visible, transitioned);
    if (visible) {
      setTransitioned(true);
    } else {
      setTransitioned(false);
    }
  };

  console.log("Transition state:", { visible, transitioned });

  return (
    <div className={className}>
      <section
        className={`${rotate ? ` infinite-rotate-${rotateDirection}` : ""}`}
      >
        <section
          className={`${!transitioned ? "textarc-transition" : "textarc-transition-out"}
          
          ${!visible ? " textarc-hidden" : " textarc-visible"}`}
          onTransitionEnd={handleTransitionEnd}
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path
              id="circlePath"
              fill="none"
              stroke-width="4"
              stroke="hsl(0 100% 50% / 0.5)"
              style={{ display: "none" }}
              d={getSVGPATH}
            />
            <text
              id="text"
              font-family="monospace"
              font-size={fontSize}
              font-weight="bold"
              fill="inherit"
            >
              <textPath
                id="textPath"
                href="#circlePath"
                {...(spread && { textLength: spreadTextLength })}
              >
                {text}
              </textPath>
            </text>
          </svg>
        </section>
      </section>
    </div>
  );
}
