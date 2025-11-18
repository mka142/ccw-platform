import React, { useState } from "react";
import SelectField from "./SelectField";
import MultipleChoiceField from "./MultipleChoiceField";
import SelectListField from "./SelectListField";
import Button from "../Button";

export const FORM_ID = "concert-preexamination-form";

interface ResearchFormData {
  age: string;
  gender: string;
  generalEducation: string;
  musicalEducation: string;
  feelings: Record<string, string>;
  concentrationLevel: string;
  concertFrequency: string;
  musicPreferences: string[];
  otherMusicPreference: string;
  deviceImpact: string;
}

interface ResearchFormProps {
  onSubmit: (data: ResearchFormData) => void;
  onCancel?: () => void;
}

const AGE_OPTIONS = [
  "poniżej 14 lat",
  "15-19",
  "20-25",
  "26-35",
  "36-45",
  "46-60",
  "powyżej 60 lat",
];

const GENDER_OPTIONS = ["kobieta", "mężczyzna"];

const GENERAL_EDUCATION_OPTIONS = [
  "podstawowe",
  "średnie ogólne",
  "średnie techniczne",
  "wyższe",
  "nie chcę podawać",
];

const MUSICAL_EDUCATION_OPTIONS = [
  "brak wykształcenia muzycznego",
  "szkoła muzyczna I stopnia",
  "szkoła muzyczna II stopnia",
  "student akademii muzycznej",
  "absolwent akademii muzycznej",
  "samodzielne wykształcenie muzyczne",
];

const FEELING_ITEMS = [
  "radośnie",
  "smutno",
  "zmęczony/a",
  "pogodnie",
  "znudzony/a",
  "dobrze",
  "rozbawiony/a",
  "nieswojo",
  "zestresowany/a",
  "zlękniony/a",
  "niewyspany/a",
  "źle",
  "rozgniewany/a",
  "pobudzony/a",
  "ponuro",
  "spięty/a",
  "usatysfakcjonowany/a",
  "zniecierpliwiony/a",
  "spokojnie",
  "stremowany/a",
  "przygnębiony/a",
  "komfortowo",
  "poirytowany/a",
  "zrelaksowany/a",
];

const FEELING_OPTIONS = ["nie", "trochę", "tak", "bardzo"];

const CONCENTRATION_OPTIONS = [
  "bardzo wysoko",
  "wysoko",
  "raczej wysoko",
  "trudno powiedzieć",
  "raczej nisko",
  "nisko",
  "bardzo nisko",
];

const CONCERT_FREQUENCY_OPTIONS = [
  "kilka razy w tygodniu",
  "kilka razy w miesiącu",
  "kilka razy w roku",
  "około raz w roku",
  "rzadziej",
];

const MUSIC_PREFERENCE_OPTIONS = [
  "muzyka klasyczna",
  "muzyka filmowa",
  "muzyka popularna",
  "muzyka jazzowa",
  "muzyka kościelna",
];

// const DEVICE_IMPACT_OPTIONS = [
//   "nie, nie zmieniło to mojego odbioru",
//   "tak, nieco mnie rozpraszało",
//   "tak, trochę mnie stresowało",
// ];

export default function ResearchForm({
  onSubmit,
  onCancel,
}: ResearchFormProps) {
  const [formData, setFormData] = useState<ResearchFormData>({
    age: "",
    gender: "",
    generalEducation: "",
    musicalEducation: "",
    feelings: {},
    concentrationLevel: "",
    concertFrequency: "",
    musicPreferences: [],
    otherMusicPreference: "",
    deviceImpact: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFeelingChange = (item: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      feelings: {
        ...prev.feelings,
        [item]: value,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg relative ">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Formularz badawczy. Projekt FAST „Co czują wrocławianie?".
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Cześć! Dziękujemy za wysłuchanie koncertu i udział w badaniu :D Na sam
          koniec jeszcze tylko kilka krótkich pytań, które pozwolą nam lepiej
          zrozumieć - co czują wrocławianie?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SelectField
          label="Wiek"
          name="age"
          options={AGE_OPTIONS}
          value={formData.age}
          onChange={(value) => setFormData((prev) => ({ ...prev, age: value }))}
          required
        />

        <SelectField
          label="Płeć"
          name="gender"
          options={GENDER_OPTIONS}
          value={formData.gender}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, gender: value }))
          }
          required
        />

        <SelectField
          label="Wykształcenie ogólne"
          name="generalEducation"
          options={GENERAL_EDUCATION_OPTIONS}
          value={formData.generalEducation}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, generalEducation: value }))
          }
          required
        />

        <SelectField
          label="Wykształcenie muzyczne"
          name="musicalEducation"
          options={MUSICAL_EDUCATION_OPTIONS}
          value={formData.musicalEducation}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, musicalEducation: value }))
          }
          required
        />

        <SelectListField
          label="Jak się dzisiaj czujesz?"
          name="feelings"
          items={FEELING_ITEMS}
          values={formData.feelings}
          onChange={handleFeelingChange}
          options={FEELING_OPTIONS}
          required
        />

        <SelectField
          label="Jak oceniasz dzisiaj swój poziom skupienia?"
          name="concentrationLevel"
          options={CONCENTRATION_OPTIONS}
          value={formData.concentrationLevel}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, concentrationLevel: value }))
          }
          required
        />

        <SelectField
          label="Jak często bywasz na koncertach na żywo (zarówno muzyki klasycznej jak i rozrywkowej)?"
          name="concertFrequency"
          options={CONCERT_FREQUENCY_OPTIONS}
          value={formData.concertFrequency}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, concertFrequency: value }))
          }
          required
        />

        <MultipleChoiceField
          label="Jakiej muzyki słuchasz na co dzień?"
          name="musicPreferences"
          options={MUSIC_PREFERENCE_OPTIONS}
          values={formData.musicPreferences}
          onChange={(values) =>
            setFormData((prev) => ({ ...prev, musicPreferences: values }))
          }
          allowOther
          otherValue={formData.otherMusicPreference}
          onOtherChange={(value) =>
            setFormData((prev) => ({ ...prev, otherMusicPreference: value }))
          }
          required
        />

        {/* <SelectField
          label="Czy urządzenie wykorzystane w badaniu zakłócało Twój odbiór koncertu i odczuwanie emocji?"
          name="deviceImpact"
          options={DEVICE_IMPACT_OPTIONS}
          value={formData.deviceImpact}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, deviceImpact: value }))
          }
          required
        /> */}

        <div className="flex gap-4 pt-6">
          <Button type="submit" variant="primary">
            Wyślij formularz
          </Button>
          {onCancel && (
            // <Button type="button" variant="secondary" onClick={onCancel}>
            //   Anuluj
            // </Button>
            <></>
          )}
        </div>
      </form>
    </div>
  );
}
