import React, { ReactNode } from "react";
import { usePreventDoubleTapZoom } from "../hooks/usePreventDoubleTapZoom";

interface NoZoomWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  includeDoubleTap?: boolean;
  includePinch?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper component that prevents double tap zoom and pinch zoom on mobile devices
 *
 * @param children - React children to wrap
 * @param enabled - Whether zoom prevention is active (default: true)
 * @param includeDoubleTap - Whether to prevent double tap zoom (default: true)
 * @param includePinch - Whether to prevent pinch zoom (default: true)
 * @param className - Additional CSS classes
 * @param style - Inline styles
 */
export function NoZoomWrapper({
  children,
  enabled = true,
  includeDoubleTap = true,
  includePinch = true,
  className = "",
  style = {},
}: NoZoomWrapperProps) {
  // Use the hook to prevent zoom
  usePreventDoubleTapZoom(enabled, includeDoubleTap, includePinch);

  // Default styles to prevent zoom but allow vertical scroll
  const defaultStyles: React.CSSProperties = {
    touchAction: "pan-y", // Only allow vertical scrolling
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
    ...style,
  };

  return (
    <div
      className={`no-zoom-wrapper ${className} absolute w-full h-full touch-none select-none overflow-hidden`}
      style={defaultStyles}
    >
      {children}
    </div>
  );
}

export default NoZoomWrapper;
