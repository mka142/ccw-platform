import React from "react";

export default function AppGuide() {
  return (
    <div className="max-w-3xl text-white space-y-6 overflow-y-auto p-3 h-full">
      <h1 className="text-4xl font-bold mb-8 text-center">Drogi Słuchaczu</h1>

      <div className="space-y-4 text-lg leading-relaxed">
        <p>
          Bardzo cieszymy się, że przyszedłeś do nas na koncert badawczy.
          Dzisiejszy wieczór to nie tylko muzyka – to także wspólne
          doświadczenie i badanie tego, jak ją odczuwamy.
        </p>

        <div className="my-6 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Jak działa aplikacja?</h2>
          <p className="mb-4">
            Aplikacja ma dwa zadania. Po pierwsze jest to Twój program,
            przewodnik koncertowy, a po drugie interfejs do rejestrowania
            napięcia muzycznego podczas słuchania utworu w czasie rzeczywistym.
          </p>
          <p className="mb-4">
            Kiedy poczujesz, że napięcie muzyczne rośnie, przesuń suwak w górę.
            Analogicznie, kiedy napięcie opada – w dół.
          </p>
          <p className="font-semibold text-orange-300">
            Nie ma tutaj żadnych ocen ani poprawnych odpowiedzi. To Twoje
            indywidualne odczucia – reaguj intuicyjnie.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold mb-3">O projekcie</h2>
          <p>
            Słuchanie muzyki związane jest z analizą wielu komponentów
            dźwiękowych. W każdej chwili doświadczamy relacji, jakie zachodzą
            między wszystkimi elementami dzieła muzycznego. Zmienność tych
            relacji jest kluczowa dla bezpośredniego odbioru i postrzegania
            napięcia muzycznego.
          </p>
          <p>
            Celem tego badania jest zbadanie, w jaki sposób publiczność podczas
            koncertu postrzega napięcie w muzyce. Zebrane dane posłużą do
            analizy wpływu elementów dzieła na odczuwane napięcie oraz ich
            zgodności z założeniami kompozytora.
          </p>
          <p>
            Projekt umożliwi lepsze zrozumienie muzyki jako narzędzia
            kształtującego emocje i świadomość odbiorców, a wyniki znajdą
            zastosowanie w muzykoterapii, personalizacji treści oraz analizie
            wpływu muzyki na procesy poznawcze.
          </p>
        </div>

        <p className="text-center text-xl font-semibold mt-8 text-orange-300">
          Dziękujemy za uczestnictwo w tym wyjątkowym doświadczeniu!
        </p>
      </div>
    </div>
  );
}
