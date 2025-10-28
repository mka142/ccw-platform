import React, { ReactNode } from 'react';

interface IosOnlySafariProps {
  children: ReactNode;
}

/**
 * Simple wrapper that only allows Safari on iOS devices
 * Shows a blocking message for any other browser on iOS
 */
export function IosOnlySafari({ children }: IosOnlySafariProps) {
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Detect Safari on iOS (Safari doesn't have CriOS, FxiOS, etc.)
  const isSafariOnIOS = isIOS && !(/CriOS|FxiOS|OPiOS|mercury|SogouMobile/.test(navigator.userAgent));
  
  // If it's iOS but not Safari, show blocking message
  if (isIOS && !isSafariOnIOS) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col justify-center items-center p-6 text-center z-[999999]">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold mb-6 text-red-400">
            Wymagana Safari
          </h1>
          
          <p className="text-base leading-relaxed mb-8 opacity-90">
            Ta aplikacja działa tylko w przeglądarce Safari na urządzeniach iOS.
          </p>
          
          <div className="bg-white/10 rounded-lg p-5 mb-6">
            <p className="text-sm mb-4 font-medium">
              Aby użyć aplikacji:
            </p>
            <ol className="text-left text-sm pl-5 leading-relaxed space-y-2">
              <li>Otwórz Safari na swoim urządzeniu</li>
              <li>Skopiuj i wklej adres URL poniżej</li>
            </ol>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">Adres URL:</p>
            <p className="text-sm text-blue-300 break-all font-mono">
              {window.location.href}
            </p>
          </div>
          
          <p className="text-xs opacity-70">
            Skopiuj powyższy adres i otwórz go w Safari
          </p>
        </div>
      </div>
    );
  }
  
  // If it's not iOS or it's Safari on iOS, render children normally
  return <>{children}</>;
}

export default IosOnlySafari;
