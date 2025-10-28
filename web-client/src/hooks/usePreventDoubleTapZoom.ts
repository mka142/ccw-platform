import { useEffect } from "react";

/**
 * Hook to prevent double tap zoom and pinch zoom on mobile devices
 *
 * @param enabled - Whether the zoom prevention is active (default: true)
 * @param includeDoubleTap - Whether to prevent double tap zoom (default: true)
 * @param includePinch - Whether to prevent pinch zoom (default: true)
 */
export function usePreventDoubleTapZoom(
  enabled: boolean = true,
  includeDoubleTap: boolean = true,
  includePinch: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const preventPinchZoom = (e: TouchEvent) => {
      if (includePinch && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventDoubleTapZoom = (e: TouchEvent) => {
      if (!includeDoubleTap) return;

      const target = e.currentTarget as HTMLElement;
      if (!target.dataset) return;
      const t2 = e.timeStamp;
      const t1 = parseFloat(target.dataset?.lastTouch || "0") || t2;
      const dt = t2 - t1;
      const fingers = e.touches.length;
      target.dataset.lastTouch = t2.toString();

      // If not a double tap, continue normal behavior
      if (!dt || dt > 500 || fingers > 1) return;

      // Prevent the double tap zoom
      e.preventDefault();

      // Manually trigger click event
      const clickTarget = e.target as HTMLElement;
      if (clickTarget && typeof clickTarget.click === "function") {
        clickTarget.click();
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    const options = { passive: false };

    if (includePinch) {
      document.addEventListener("touchstart", preventPinchZoom, options);
    }

    if (includeDoubleTap) {
      document.addEventListener("touchstart", preventDoubleTapZoom, options);
    }

    // Cleanup function
    return () => {
      if (includePinch) {
        document.removeEventListener("touchstart", preventPinchZoom);
      }
      if (includeDoubleTap) {
        document.removeEventListener("touchstart", preventDoubleTapZoom);
      }
    };
  }, [enabled, includeDoubleTap, includePinch]);
}

export default usePreventDoubleTapZoom;
