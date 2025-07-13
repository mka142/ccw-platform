import {
  FormSchema,
  //FormPage,
  setEachFieldRequired,
  validateEachFieldHasId,
  validateUniqueId,
} from "@/lib/formSchema";

const AUDIO_DIR = "/audio/form1";

/*const afterPieceQuestions = (s: number | string, isFirst = false): FormPage => {
  const fields: FormPage["fields"] = [
    {
      title: "Czy znasz wysłuchany fragment utworu?",
      type: "select",
      options: ["Tak", "Nie"],
      id: `${s}-0`,
    },
    {
      title: "Jak ogólnie oceniasz wysłuchany fragment utworu?",
      type: "choicesWithCustom",
      options: [
        "Bardzo mi się podobał",
        "Był mi obojętny",
        "Nie podobał mi się",
        "Był ciekawy",
        "Był męczący",
        "Był nudny",
        "Był porywający",
      ],
      id: `${s}-1`,
    },
    {
      title: "Jak oceniasz poziom napięcia muzycznego w wysłuchanym utworze?",
      type: "select",
      options: [
        "Napięcie było wysokie",
        "Napięcie było bardzo zmienne",
        "Napięcie narastało",
        "Napięcie było niewielkie",
        "Napięcie było nieobecne",
      ],
      id: `${s}-2`,
    },
  ];
  if (!isFirst) {
    fields.push({
      title:
        "Czy przytoczony przykład był bogatszy w napięcie muzyczne niż poprzedni przykład?",
      type: "select",
      options: ["Tak", "Nie", "Taki sam"],
      id: `${s}-3`,
    });
  }

  return {
    fields,
  };
};*/

const form1: FormSchema = {
  formId: "music-tension-survey-pilot-2025",
  formTitle: "Pilotażowy formularz badawczy - <i>Napięcie muzyczne</i>",
  formDescription:
    "Ten anonimowy formularz jest częścią badania dotyczącego napięcia muzycznego. Twoje odpowiedzi pomogą nam lepiej zrozumieć, jak ludzie postrzegają napięcie w muzyce.</br> Formularz jest anonimowy i zajmie około 10-20 minut.",
  formPages: [
    {
      title: "Część I",
      fields: [
        {
          title: "Ile masz lat?",
          type: "listSelect",
          options: Array.from({ length: 100 }, (_, i) => (i + 1).toString()),
          id: "d1",
        },
        {
          title: "Jaka jest twoja płeć?",
          type: "select",
          options: ["mężczyzna", "kobieta", "inna"],
          id: "d2",
        },
        {
          title: "Czy lubisz słuchać muzyki?",
          type: "select",
          options: [
            "nie, nie lubię",
            "raczej nie lubię",
            "nie mam zdania",
            "lubię",
            "tak, bardzo lubię",
          ],
          id: "d3",
        },
        {
          title: "Jakiej muzyki na co dzień lubisz słuchać?",
          type: "choicesWithCustom",
          options: ["muzyka poważna", "filmowa", "popularna", "ludowa"],
          id: "d4",
        },
      ],
    },
    {
      fields: [
        {
          title:
            "Czy spotkałaś/eś się już kiedyś z pojęciem: napięcie muzyczne?",
          type: "select",
          options: ["tak", "nie"],
          id: "t1",
        },
        {
          title:
            "Spróbuj scharakteryzować, czym może być dla Ciebie napięcie muzyczne?",
          description:
            "Napięcie muzyczne to subiektywne poczucie oczekiwania, niepokoju lub rozwiązania, które powstaje w wyniku zmian w muzyce, takich jak harmonia, melodia, rytm czy dynamika. (Farbood, 2006)",
          type: "choicesWithCustom",
          options: [
            "To fizyczne i emocjonalne odczucie rosnącego podekscytowania lub niepewności",
            "To gra z oczekiwaniami, celowe opóźnianie lub zaprzeczanie spodziewanym rozwiązaniom w muzyce",
            "To wzrost głośności, wysokości melodii lub przyspieszenie tempa",
            "To niestabilne akordy w harmonii, które w naturalny sposób dążą do rozwiązania",
            "To narastanie intensywności, które prowadzi do punktu kulminacyjnego, a następnie do odprężenia",
          ],
          id: "t2",
        },
      ],
    },
    {
      fields: [
        {
          title:
            "Czy warunki, w których wypełniasz ten formularz, sprzyjają skupieniu?",
          type: "select",
          options: [
            "Zdecydowanie nie sprzyjają (jest bardzo głośno/rozpraszająco)",
            "Raczej nie sprzyjają (jest trochę głośno/rozpraszająco)",
            "Raczej sprzyjają (jest umiarkowanie cicho/spokojnie)",
            "Zdecydowanie sprzyjają (jest bardzo cicho/spokojnie)",
          ],
          id: "t3",
        },
        {
          title: "Czy używasz słuchawek?",
          label: "(Niezwykle zalecane)",
          type: "select",
          options: ["tak", "nie"],
          id: "t4",
        },
        {
          title: "Na jakim urządzeniu wypełniasz ten formularz?",
          label: "(Zalecane jest urządzenie z ekranem dotykowym)",
          type: "select",
          options: ["komputer", "tablet", "telefon"],
          id: "t5",
        },
        {
          title: "Jak się dzisiaj czujesz?",
          type: "choicesWithCustom",
          options: [
            "szczęśliwie",
            "spokojnie",
            "zestresowany/a",
            "zmęczony/a",
            "podekscytowany/a",
            "smutno",
          ],
          id: "t6",
        },
      ],
    },
    {
      title: "Część II",
      description: `Wysłuchasz teraz kilku (nastu) przykładów muzycznych. Po każdym z nich należy odpowiedzieć na pytania dotyczące odczuwanych wrażeń.</br></br>
        Gdy będziesz gotowy/a, kliknij przycisk: <strong>Odtwórz</strong>, aby rozpocząć.</br>
        Podczas słuchania użyj <strong>Suwaka ↕️</strong>, by ocenić odczuwane napięcie muzyczne: przesuń go w górę ⬆️, gdy napięcie wzrasta, a w dół ⬇️, gdy maleje.
        Po zakończeniu odtwarzania przejdź do następnego pytania.</br></br>
        Gdybyś miał jeszcze wątpliwość, czym może być napięcie muzyczne może, dla inspiracji proponuję jego definicję według Forbooda (2006):</br>
        <i>Napięcie muzyczne to odczuwalne przez słuchacza narastanie podekscytowania lub niepewności, które zmierza do punktu kulminacyjnego, a następnie rozwiązania. Jest to fundamentalne zjawisko łączące obiektywną strukturę muzyki z subiektywną, emocjonalną odpowiedzią odbiorcy.</i>
        <br/><br/>
        <strong>Uwaga:</strong> Przykładów można słuchać tylko w całości, postaraj się więc skupić na każdym z nich 😉</br>
        `,
      fields: [
        {
          title: "Przykład 1: Początek Pasji Janowej 'Herr, unser Herrsher'",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/1-Bach-St_John_Passion.mp3`,
          id: "m1",
        },
      ],
    } /*,
    afterPieceQuestions("m1", true),
    {
      fields: [
        {
          title: "Przykład 2: Beethoven zmiana tempa w Egmont",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/2-Beethoven-Egmont_Overture.mp3`,
          id: "m2",
        },
      ],
    },
    afterPieceQuestions("m2"),
    {
      fields: [
        {
          title: "Przykład 3: Czajkowski finał V symfonii",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/3-Tchaikovsky-Symphony-No_5.mp3`,
          id: "m3",
        },
      ],
    },
    afterPieceQuestions("m3"),
    {
      fields: [
        {
          title: "Przykład 4: Wagner Tristan i Izolda",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/4-Wagner-Tristan_und_Isolde.mp3`,
          id: "m4",
        },
      ],
    },
    afterPieceQuestions("m4"),
    {
      fields: [
        {
          title: "Przykład 5: Gaubert akwarele",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/5-Gaubert-Trois_Aquarelles_for_Flute_Cello_&_Piano.mp3`,
          id: "m5",
        },
      ],
    },
    afterPieceQuestions("m5"),
    {
      fields: [
        {
          title: "Przykład 6: Ravel kwartet cz. II",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/6-Ravel-String_Quartet.mp3`,
          id: "m6",
        },
      ],
    },
    afterPieceQuestions("m6"),
    {
      fields: [
        {
          title: "Przykład 7: Enescu Legenda przejście na część szybką",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/7-Enescu-Légende.mp3`,
          id: "m7",
        },
      ],
    },
    afterPieceQuestions("m7"),
    {
      fields: [
        {
          title: "Przykład 8: Barber God's Grandeur",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/8-Barber-God's_Grandeur.mp3`,
          id: "m8",
        },
      ],
    },
    afterPieceQuestions("m8"),
    {
      fields: [
        {
          title: "Przykład 9: Stravinsky Ognisty ptak suita cz II",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/9-Stravinsky-The_Firebird_Suite.mp3`,
          id: "m9",
        },
      ],
    },
    afterPieceQuestions("m9"),
    {
      fields: [
        {
          title: "Przykład 10: Bacewicz kwartet smyczkowy 2",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/10-Bacewicz-Concerto_for_String_Orchestra.mp3`,
          id: "m10",
        },
      ],
    },
    afterPieceQuestions("m10"),
    {
      fields: [
        {
          title: "Przykład 11: Scriabin op 74 preludium 3",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/11-Scriabin-Prelude_Op_75_No_3.mp3`,
          id: "m11",
        },
      ],
    },
    afterPieceQuestions("m11"),
    {
      fields: [
        {
          title: "Przykład 12: Salonem koncert wiolonczelowy",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/12-Salonen-Concerto_pour_violoncelle.mp3`,
          id: "m12",
        },
      ],
    },
    afterPieceQuestions("m12"),
    {
      fields: [
        {
          title: "Przykład 13: Brian Ferneyhough - Exordium",
          type: "musicSlider",
          audioSrc: `${AUDIO_DIR}/13-Ferneyhough-Exordium.mp3`,
          id: "m13",
        },
      ],
    },
    afterPieceQuestions("m13"),
    {
      title: "Koniec przykładów muzycznych",
      description:
        "Dziękujemy za wysłuchanie przykładów muzycznych. Prosimy o odpowiedzi na ostatnie kilka pytań.",
      fields: [
        {
          title:
            "Jak oceniasz swoje ogólne kompetencje muzyczne (np. rozpoznawanie instrumentów, stylów, teorii muzyki)?",
          type: "select",
          options: [
            "Bardzo niskie",
            "Niskie",
            "Średnie",
            "Wysokie",
            "Bardzo wysokie",
          ],
          id: "d5",
        },
        {
          title:
            "Jak ogólnie oceniasz swoją wrażliwość muzyczną (np. zdolność do odczuwania emocji, reagowania na niuanse)?",
          type: "select",
          options: [
            "Bardzo niska",
            "Niska",
            "Średnia",
            "Wysoka",
            "Bardzo wysoka",
          ],
          id: "d6",
        },
        {
          title: "Jaki jest Twój poziom wykształcenia muzycznego?",
          type: "selectWithCustom",
          options: [
            "Brak",
            "Podstawowy (np. szkoła muzyczna I stopnia, prywatne lekcje)",
            "Średni (np. szkoła muzyczna II stopnia)",
            "Wyższy (np. Akademia Muzyczna)",
          ],
          id: "d7",
        },
        {
          title:
            "Wybierz spośród podanych kompozytorów tych, których chętnie słuchasz na co dzień:",
          type: "choicesWithCustom",
          options: [
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
          ],
          id: "d8",
        },
        {
          title: "Jak często średnio dziennie słuchasz muzyki?",
          type: "select",
          options: [
            "W ogóle nie słucham",
            "1-5 min",
            "5-10 min",
            "10-20 min",
            "20-60 min",
            "1-2h",
            "2-4h",
            "ponad 4h",
          ],
          id: "d9",
        },
        {
          title: "Czy grasz na jakimś instrumencie muzycznym?",
          type: "choicesWithCustom",
          options: [
            "Nie",
            "flet",
            "obój",
            "klarnet",
            "fagot",
            "trąbka",
            "puzon",
            "tuba",
            "perkusja",
            "harfa",
            "fortepian",
            "skrzypce",
            "altówka",
            "wiolonczela",
            "kontrabas",
          ],
          id: "d10",
        },
        {
          title: "Jeśli tak, to ile średnio dziennie grasz na instrumencie?",
          type: "select",
          options: [
            "Brak",
            "1-5 min",
            "5-10 min",
            "10-20 min",
            "20-60 min",
            "1-2h",
            "2-4h",
            "ponad 4h",
          ],
          id: "d11",
        },
        {
          title:
            "Jaki jest najwyższy poziom wykształcenia, jaki osiągnąłeś/aś?",
          type: "select",
          options: ["Podstawowe", "Zawodowe", "Średnie", "Wyższe"],
          id: "d12",
        },
        {
          title: "Jaki jest najwyższy poziom wykształcenie Twoich rodziców?",
          type: "select",
          options: ["Podstawowe", "Zawodowe", "Średnie", "Wyższe"],
          id: "d13",
        },
      ],
    },
    {
      title: "I to już koniec!",
      description: `Jeśli dotarłeś/aś do tego miejsca, to znaczy, że wypełniłeś/aś cały formularz. Dziękujemy za Twoje odpowiedzi! Twoja pomoc jest dla nas bardzo cenna.</br></br>
        Jeśli masz jakieś uwagi lub sugestie dotyczące formularza, możesz je zostawić poniżej.</br></br>
        A ponieważ jest to pilotażowy formularz, Twoja opinia jest fakultatywnie OBOWIĄZKOWA.`,
      fields: [
        {
          title: "Jak ogólnie oceniasz ten formularz?",
          type: "choicesWithCustom",
          options: [
            "Bardzo źle",
            "Raczej źle",
            "Średnio",
            "Raczej dobrze",
            "Bardzo dobrze",
          ],
          id: "d14",
        },
        {
          title: "Czy formularz był dla Ciebie zrozumiały?",
          type: "select",
          options: ["Tak", "Nie"],
          id: "d15",
        },
        {
          title: "Czy formularz był dla Ciebie interesujący?",
          type: "select",
          options: ["Tak", "Nie"],
          id: "d16",
        },
        {
          title:
            "Czy uważasz, że przykłady muzyczne były dobrze dobrane do badania napięcia muzycznego?",
          type: "selectWithCustom",
          options: ["Tak", "Nie"],
          id: "d17",
        },
        {
          title: "Czy zaproponowałbyś inne przykłady muzyczne?",
          type: "longText",
          id: "d18",
          defaultValue: "Nie, przykłady były dobre.",
        },
        {
          title:
            "Jakie są Twoje ogólne wrażenia z używania Suwaka w przykładach muzycznych?",
          type: "choicesWithCustom",
          options: [
            "Suwak był bardzo intuicyjny i łatwy w użyciu",
            "Suwak był w porządku, ale mógłby być lepszy",
            "Suwak był trudny w użyciu i nieintuicyjny",
            "Suwak był zbędny i nie wnosił nic do formularza",
          ],
          id: "d19",
        },
        {
          title:
            "Czy wyobrażasz sobie jakiś inny optymalny sposób pomiaru napięcia muzycznego?",
          type: "choicesWithCustom",
          options: [
            "Okrągłe pokrętło",
            "Klikanie w ekran w zależności od odczuwanego napięcia",
            "Inny suwak (np. poziomy)",
            "Suwak bez kolorowych rozbłysków",
            "Suwak z innymi kolorami",
            "Rodzaj suwaka, ale z inną animacją",
          ],
          id: "d20",
        },
        {
          title:
            "Jak oceniasz resztę pytań i wrażenia z wypełniania formularza?",
          type: "choices",
          options: [
            "niedobrze",
            "raczej niedobrze",
            "średnio",
            "raczej dobrze",
            "dobrze",
          ],
          id: "d21",
        },
        {
          title:
            "Inne uwagi, które mogą nam pomóc ulepszyć formularz w przyszłości:",
          type: "longText",
          id: "d22",
          defaultValue: "Brak",
        },
        {
          title: "Email",
          label:
            "Jeśli chcesz, możesz zostawić swój email, abyśmy mogli się z Tobą skontaktować w sprawie formularza.",
          type: "text",
          id: "d23",
        },
      ],
    },*/,
  ],
};

validateEachFieldHasId(form1);
validateUniqueId(form1);
setEachFieldRequired(form1, true);

export default form1;
