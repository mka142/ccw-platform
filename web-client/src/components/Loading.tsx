import React from "react";
import Logo from "./Logo";
import clsx from "clsx";

const noteClasses = "w-12 h-12 mx-2 inline-block animate-bounce text-glow";

/**
 * Musical note component using logo.svg
 */
function MusicNote({ delay }: { delay: string }) {
  return (
    <div
      className={clsx(noteClasses)}
      style={{
        animationDelay: delay,
      }}
    >
      <Logo size="100%" fill="currentColor" title="Musical Note" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex items-center mt-2">
        <MusicNote delay="0ms" />
        <MusicNote delay="200ms" />
        <MusicNote delay="400ms" />
      </div>
      <p className="text-glow/80 mt-4 text-2xl">Ładowanie...</p>
    </div>
  );
}
