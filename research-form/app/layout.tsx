import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Co czują Wrocławianie? – badanie odbioru napięcia w muzyce podczas koncertu | Sztuki muzyczne, kognitywistyka, psychologia, AI",
  description:
    "Projekt „Co czują Wrocławianie?” to interdyscyplinarne badanie percepcji napięcia muzycznego podczas koncertu, realizowane z użyciem nowoczesnego, wielomodalnego systemu ciągłej akwizycji i synchronizacji reakcji publiczności. Celem jest zrozumienie, jak słuchacze – zarówno profesjonaliści, jak i amatorzy – odbierają napięcie w muzyce na żywo. Uczestnicy rejestrują swoje odczucia za pomocą aplikacji mobilnej lub dedykowanego urządzenia CRDI, a zebrane dane pozwolą na analizę wpływu elementów dzieła na emocje i zgodność z intencją kompozytora. Wyniki posłużą do rozwoju muzykoterapii, personalizacji treści i badań nad procesami poznawczymi. Projekt realizowany przez AMKL, zakłada udział ponad 100 osób podczas dwóch koncertów (X/XI 2025). Efektem będzie raport dostępny online, pogłębiający wiedzę o neurologicznych i psychologicznych mechanizmach odbioru muzyki oraz roli muzyki w kształtowaniu emocji i świadomości.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var c = document.documentElement.classList;
                  if (d && !c.contains('dark')) c.add('dark');
                  if (!d && c.contains('dark')) c.remove('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
