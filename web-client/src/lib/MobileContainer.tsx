// Utility to check if user is on a mobile device
export function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Utility to check orientation: returns 'portrait' or 'landscape'
export function getOrientation() {
  if (typeof window === "undefined") return "unknown";
  if (
    window.screen &&
    window.screen.orientation &&
    window.screen.orientation.type
  ) {
    return window.screen.orientation.type.startsWith("landscape")
      ? "landscape"
      : "portrait";
  }
  // Fallback for older browsers
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}
import React, { useEffect, useMemo } from "react";

const useOrientation = () => {
  const [orientation, setOrientation] = React.useState(getOrientation());

  useEffect(() => {
    const handleResize = () => {
      setOrientation(getOrientation());
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return orientation;
};

export default function MobileContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const orientation = useOrientation();
  function touchHandler(event) {
    if (event.touches.length > 1) {
      //the event is multi-touch
      //you can then prevent the behavior
      event.preventDefault();
    }
  }

  useEffect(() => {
    // Prevent pinch zoom on mobile devices
    document.addEventListener("touchstart", touchHandler, { passive: false });
    return () => {
      document.removeEventListener("touchstart", touchHandler);
    };
  }, []);

  if (!isMobile()) {
    return (
      <div className="absolute top-0 left-0 w-full h-full ">
        <div className="flex items-center justify-center h-screen">
          <p className="text-2xl text-gray-500">
            Ta aplikacja jest zoptymalizowana do działania na urządzeniach
            mobilnych. Proszę otworzyć ją na telefonie lub tablecie.
          </p>
        </div>
      </div>
    );
  }

  if (orientation === "landscape") {
    // If in landscape mode, do not render children
    return (
      <div className="absolute top-0 left-0 w-full h-full ">
        <div className="flex items-center justify-center h-screen">
          <p className="text-2xl text-gray-500">
            Obróć telefon w pionie, aby kontynuować
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
