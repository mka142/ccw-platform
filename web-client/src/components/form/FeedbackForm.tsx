import React, { useState } from "react";
import SelectField from "./SelectField";
import SelectListField from "./SelectListField";
import Button from "../Button";

export const FEEDBACK_FORM_ID = "concert-feedback-form";

interface FeedbackFormData {
  overallExperience: string;
  emotionalImpact: Record<string, string>;
  tensionSliderExperience: string;
  concertLength: string;
  recommendation: string;
  additionalComments: string;
}

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => void;
  onCancel?: () => void;
}

const OVERALL_EXPERIENCE_OPTIONS = [
  "bardzo pozytywnie",
  "pozytywnie",
  "neutralnie",
  "raczej negatywnie",
  "negatywnie",
];

const EMOTIONAL_IMPACT_ITEMS = [
  "zrelaksowany/a",
  "pobudzony/a",
  "zainspirowany/a",
  "zmęczony/a",
  "usatysfakcjonowany/a",
  "skoncentrowany/a",
  "poruszony/a",
  "spokojny/a",
];

const EMOTIONAL_IMPACT_OPTIONS = [
  "wcale",
  "słabo",
  "średnio",
  "mocno",
  "bardzo mocno",
];

const SLIDER_EXPERIENCE_OPTIONS = [
  "bardzo łatwe i intuicyjne",
  "łatwe",
  "w miarę łatwe",
  "trudne",
  "bardzo trudne",
  "nie używałem/am suwaka",
];

const CONCERT_LENGTH_OPTIONS = ["za krótki", "w sam raz", "za długi"];

const RECOMMENDATION_OPTIONS = [
  "zdecydowanie tak",
  "raczej tak",
  "nie wiem",
  "raczej nie",
  "zdecydowanie nie",
];

export default function FeedbackForm({
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [formData, setFeedbackData] = useState<FeedbackFormData>({
    overallExperience: "",
    emotionalImpact: {},
    tensionSliderExperience: "",
    concertLength: "",
    recommendation: "",
    additionalComments: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleEmotionalImpactChange = (item: string, value: string) => {
    setFeedbackData((prev) => ({
      ...prev,
      emotionalImpact: {
        ...prev.emotionalImpact,
        [item]: value,
      },
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Opinia o koncercie
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Dziękujemy za udział w koncercie! Twoja opinia jest dla nas bardzo
          ważna. Prosimy o krótką ocenę dzisiejszego doświadczenia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SelectField
          label="Jak ogólnie oceniasz dzisiejszy koncert?"
          name="overallExperience"
          options={OVERALL_EXPERIENCE_OPTIONS}
          value={formData.overallExperience}
          onChange={(value) =>
            setFeedbackData((prev) => ({ ...prev, overallExperience: value }))
          }
          required
        />

        <SelectListField
          label="W jakim stopniu koncert wpłynął na Twoje samopoczucie?"
          name="emotionalImpact"
          items={EMOTIONAL_IMPACT_ITEMS}
          values={formData.emotionalImpact}
          onChange={handleEmotionalImpactChange}
          options={EMOTIONAL_IMPACT_OPTIONS}
          required
        />

        <SelectField
          label="Jak oceniasz obsługę suwaka do pomiaru napięcia?"
          name="tensionSliderExperience"
          options={SLIDER_EXPERIENCE_OPTIONS}
          value={formData.tensionSliderExperience}
          onChange={(value) =>
            setFeedbackData((prev) => ({
              ...prev,
              tensionSliderExperience: value,
            }))
          }
          required
        />

        <SelectField
          label="Jak oceniasz długość koncertu?"
          name="concertLength"
          options={CONCERT_LENGTH_OPTIONS}
          value={formData.concertLength}
          onChange={(value) =>
            setFeedbackData((prev) => ({ ...prev, concertLength: value }))
          }
          required
        />

        <SelectField
          label="Czy poleciłbyś ten koncert znajomym?"
          name="recommendation"
          options={RECOMMENDATION_OPTIONS}
          value={formData.recommendation}
          onChange={(value) =>
            setFeedbackData((prev) => ({ ...prev, recommendation: value }))
          }
          required
        />

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dodatkowe uwagi lub komentarze{" "}
            <span className="text-gray-400">(opcjonalne)</span>
          </label>
          <textarea
            name="additionalComments"
            value={formData.additionalComments}
            onChange={(e) =>
              setFeedbackData((prev) => ({
                ...prev,
                additionalComments: e.target.value,
              }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none"
            rows={4}
            placeholder="Podziel się swoimi uwagami na temat koncertu..."
          />
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" variant="primary" className="w-full">
            Wyślij opinię
          </Button>
          {onCancel && <></>}
        </div>
      </form>
    </div>
  );
}
