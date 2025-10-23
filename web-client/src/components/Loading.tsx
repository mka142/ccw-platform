import React from "react";
import logo from "../logo.svg";

const noteClasses = "w-12 h-12 mx-2 inline-block animate-bounce";

/**
 * Musical note component using logo.svg
 */
function MusicNote({ delay }: { delay: string }) {
  return (
    <img
      src={logo}
      alt="Note"
      className={noteClasses}
      style={{ animationDelay: delay }}
    />
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
      <p className="text-gray-600 mt-4 text-2xl">Ładowanie...</p>
    </div>
  );
}
