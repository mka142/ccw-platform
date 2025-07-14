import React, { useEffect } from "react";

interface FullscreenProps {
  activated: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Fullscreen({
  activated,
  className,
  children,
}: FullscreenProps) {
  useEffect(() => {
    if (activated) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activated]);

  if (!activated) return <>{children}</>;

  return (
    <div
      style={{ zIndex: 49 }} // Safari does not like tailwind z-index
      className={
        "fixed inset-0 z-[49] bg-background flex items-center justify-center " +
        (className || "")
      }
      onScroll={(e) => e.stopPropagation()}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-auto">
        {children}
      </div>
    </div>
  );
}
