# CCW Platform

Platforma CCW to zestaw trzech wzajemnie powiązanych projektów stworzonych do zarządzania i wspierania koncertów muzycznych oraz badania i analizy napięcia muzycznego z wykorzystaniem technologii webowych i IoT.

## 📁 Struktura Projektu

### 🖥️ `device-manager`

Serwer Bun dostarczający interfejs webowy do wysyłania poleceń do klientów podłączonych przez WebSockets.

**Charakterystyka:**

- **Technologia:** Bun, Express, WebSockets (ws), EJS
- **Przeznaczenie:** Zarządzanie stanem aplikacji webowych i urządzeń IoT podczas koncertów muzycznych
- **Funkcjonalność:** Panel administracyjny do dyspozycji komend w czasie rzeczywistym
- **Planowane rozszerzenia:** Implementacja protokołu MQTT dla urządzeń IoT

**Uruchomienie:**

```bash
cd device-manager
bun install
bun run start
```

Pod domyślnym adresem <http://localhost:3000> dostępny jest panel administracyjny.

Dostępny jest również testowy client WebSocket pod adresem <http://localhost:3000/test-iot>. Po aktywacji koncertu w panelu admina, klient ten będzie mógł odbierać i wyświetlać wysyłane komendy.

### 📋 `research-form`

Aplikacja Next.js do zbierania odpowiedzi w ramach badań nad napięciem muzycznym.

**Charakterystyka:**

- **Technologia:** Next.js 15, React, TypeScript, MongoDB, Tailwind CSS
- **Przeznaczenie:** Formularz badawczy dotyczący percepcji napięcia w muzyce
- **Funkcjonalność:** Zbieranie i przechowywanie odpowiedzi respondentów w bazie MongoDB
- **Infrastruktura:** Docker Compose do zarządzania bazą danych

**Uruchomienie:**

```bash
cd research-form
npm install
# Uruchom MongoDB
docker-compose up -d
# Uruchom serwer deweloperski
npm run dev
```
Pod domyślnym adresem <http://localhost:3000> dostępny jest formularz badawczy.
W pliku `research-form/mongoexport.json` znajdują się przykładowe dane do wczytania w formularzu. By je załadować, należy otworzyć bazę `research_form` w `Mongo Express` pod adresem <http://localhost:8081/db/ccw/research_form> i użyć opcji `Import -- mongoexport json`.
Odpowiedzi można przeglądać pod adresem: <http://localhost:3000/responses/music-tension-survey-pilot-2025/summary>

### 🎭 `web-client`

Klient webowy używany przez uczestników koncertu.

**Charakterystyka:**

- **Technologia:** React 19, Bun, Tailwind CSS, Framer Motion
- **Przeznaczenie:** Interfejs użytkownika dla widzów podczas koncertu

**Uruchomienie:**

```bash
cd web-client
bun install
bun dev
```

**Payloady stron:**

- `AppGuidePage` - Brak payloadu
- `BeforeConcertPage` - Brak payloadu  
- `ConcertStartPage` - Brak payloadu
- `SliderDemoPage` - Brak payloadu
- `PieceAnnouncementPage` - `{ pieceTitle, pieceDescription, ...PieceData }`
- `TensionMeasurementPage` - `{ pieceId }`
- `OvationPage` - `{ message }`
- `EndOfConcertPage` - Brak payloadu
- `FeedbackFormPage` - Brak payloadu

## 🔗 Architektura Systemu

```
┌─────────────────┐
│  web-client     │ ←─── Użytkownicy koncertu
│  (React + Bun)  │
└────────┬────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│ device-manager  │ ←─── Administrator koncertu
│ (Bun Server)    │
└────────┬────────┘
         │
         │ (przyszłość: MQTT)
         ▼
┌─────────────────┐
│  Urządzenia IoT │
└─────────────────┘

        +
    
┌─────────────────┐
│ research-form   │ ←─── Badacze / Respondenci
│ (Next.js)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

## 🚀 Szybki Start

1. **Sklonuj repozytorium:**

   ```bash
   git clone <repository-url>
   cd ccw-platform
   ```
2. **Uruchom poszczególne projekty** zgodnie z instrukcjami w sekcji "Struktura Projektu"

## 🛠️ Technologie

- **Runtime:** Bun (device-manager, web-client), Node.js (research-form)
- **Frontend:** React 19, Next.js 15, Tailwind CSS, Framer Motion
- **Backend:** Express, WebSockets
- **Baza danych:** MongoDB
- **Narzędzia:** TypeScript, Docker Compose

## 📝 Licencja

Prywatny projekt badawczy.

## 👥 Kontakt

Projekt rozwijany w ramach badań nad interaktywnymi koncertami muzycznymi.
