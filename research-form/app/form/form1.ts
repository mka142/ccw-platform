export const FORM = {
  "formId": "music-tension-survey-2025",
  "formTitle": "Ankieta o napięciu muzycznym",
  "formDescription": "Prosimy o szczere odpowiedzi na poniższe pytania dotyczące Twoich doświadczeń muzycznych.",
  "formPages": [
    {
      "fields": [
        {
          "title": "Ile masz lat?",
          "type": "select",
          "options": Array.from({length: 113}, (_, i) => (i + 1).toString())
        },
        {
          "title": "Jaka jest twoja płeć?",
          "type": "choices",
          "options": ["mężczyzna", "kobieta", "inna"]
        },
        {
          "title": "Czy lubisz słuchać muzyki?",
          "type": "choices",
          "options": [
            "nie, nie lubię",
            "raczej nie lubię",
            "nie mam zdania",
            "lubię",
            "tak, bardzo lubię"
          ]
        },
        {
          "title": "Jakiej muzyki na co dzień lubisz słuchać?",
          "type": "choicesWithCustom",
          "options": [
            "muzyka poważna",
            "filmowa",
            "popularna",
            "ludowa"
          ]
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Czy słyszałeś kiedyś termin napięcie muzyczne?",
          "type": "choices",
          "options": ["tak", "nie"]
        },
        {
          "title": "Spróbuj scharakteryzować, czym może być dla Ciebie napięcie muzyczne?",
          "description": "Napięcie muzyczne to subiektywne poczucie oczekiwania, niepokoju lub rozwiązania, które powstaje w wyniku zmian w muzyce, takich jak harmonia, melodia, rytm czy dynamika. (Farbood, 2006)",
          "type": "choicesWithCustom",
          "options": [
            "stan pomiędzy kulminacją a rozwiązaniem",
            "nagłe zmiany dynamiczne",
            "wtedy kiedy jest głośno",
            "inne"
          ]
        }
      ]
    },
    {
      "fields": [
        {
          "title": "W jakich warunkach wypełniasz ten formularz?",
          "type": "choices",
          "options": [
            "jest głośno",
            "trochę głośno",
            "trochę cicho",
            "cicho"
          ]
        },
        {
          "title": "Czy używasz słuchawek?",
          "type": "choices",
          "options": ["tak", "nie"]
        },
        {
          "title": "Na jakim urządzeniu wypełniasz ten formularz?",
          "type": "choices",
          "options": ["komputer", "tablet", "telefon"]
        },
        {
          "title": "Jak opiszesz dzisiaj swoje samopoczucie?",
          "type": "listSelect",
          "options": [
            "szczęśliwy/a",
            "spokojny/a",
            "zestresowany/a",
            "zmęczony/a",
            "podekscytowany/a",
            "smutny/a",
            "inna"
          ]
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 1: Początek Pasji Janowej 'Herr, unser Herrsher'",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 2: Beethoven zmiana tempa w Egmont",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 3: Czajkowski finał V symfonii",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 4: Wagner Tristan i Izolda",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 5: Gaubert akwarele",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 6: Ravel kwartet cz. II",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 7: Enescu Legenda przejście na część szybką",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 8: Barber God's Grandeur",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 9: Stravinsky Ognisty ptak suita cz II",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 10: Bacewicz kwartet smyczkowy 2",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 11: Scriabin op 74 preludium 3",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 12: Salonem koncert wiolonczelowy",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Przykład 13: Brian Ferneyhough - Exordium",
          "type": "musicSlider"
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Jakie jest twój poziom edukacji muzycznej?",
          "type": "choices",
          "options": [
            "brak",
            "pierwszy stopień",
            "drugi stopień",
            "akademia muzyczna"
          ]
        },
        {
          "title": "Wybierz spośród podanych kompozytorów tych, których chętnie słuchasz na co dzień:",
          "type": "listSelect",
          "options": [
            "Bach",
            "Beethoven",
            "Czajkowski",
            "Wagner",
            "Gaubert",
            "Ravel",
            "Enescu",
            "Barber",
            "Stravinsky",
            "Bacewicz",
            "Scriabin",
            "Salonem",
            "Ferneyhough",
            "inna"
          ]
        },
        {
          "title": "Jak często średnio dziennie słuchasz muzyki?",
          "type": "choices",
          "options": [
            "1-5 min",
            "5-10 min",
            "10-20 min",
            "20-60 min",
            "1-2h",
            "2-4h",
            "ponad 4h"
          ]
        },
        {
          "title": "Czy grasz na jakimś instrumencie muzycznym?",
          "type": "choicesWithCustom",
          "options": [
            "fortepian",
            "skrzypce",
            "gitara",
            "flet",
            "perkusja",
            "inna"
          ]
        },
        {
          "title": "Jeśli tak, to ile średnio dziennie grasz na instrumencie?",
          "type": "choices",
          "options": [
            "1-5 min",
            "5-10 min",
            "10-20 min",
            "20-60 min",
            "1-2h",
            "2-4h",
            "ponad 4h"
          ]
        }
      ]
    },
    {
      "fields": [
        {
          "title": "Jak oceniasz dobór przykładów i wrażenia z wypełniania formularza?",
          "type": "choices",
          "options": [
            "niedobrze",
            "raczej niedobrze",
            "średnio",
            "raczej dobrze",
            "dobrze"
          ]
        },
        {
          "title": "Uwagi, które mogą nam pomóc ulepszyć formularz w przyszłości:",
          "type": "longText"
        },
        {
          "title": "Email jeśli chcesz uzyskać dalsze informacje dotyczące projektu i napięcia muzycznego.",
          "type": "text"
        }
      ]
    }
  ]
}
