"use client";
import { FormProvider, useFormContext } from "@/components/form/FormProvider";
import { Question } from "@/components/form/Question";
import {
  ShortTextField,
  LongTextField,
  SelectField,
  MultiSelectField,
  SelectWithOwnField,
  MultiSelectWithOwnField,
  AudioSliderField,
} from "@/components/form/fields";

import { motion } from "framer-motion";
import FormPages from "@/components/form/FormPages";
import { Controller } from "react-hook-form";

export default function FormPage() {
  return (
    <FormProvider>
      <FormContent />
    </FormProvider>
  );
}

function FormContent() {
  const {
    getValues,
    control,
    formState: { errors, touchedFields },
  } = useFormContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-2xl mx-auto py-10 px-4"
    >
      <h1 className="text-3xl font-bold mb-4 font-serif">Formularz badawczy</h1>
      <p className="mb-8 text-gray-700">
        Przykładowy formularz prezentujący wszystkie typy pól.
      </p>
      <FormPages
        onFinish={async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log("Formularz został wysłany");
          try {
            console.log("Wartości formularza:", getValues());
            // Here you can handle form submission, e.g., send data to an API
            return true;
          } catch (error) {
            console.error("Błąd podczas wysyłania formularza:", error);
            return false;
          }
        }}
      >
        <FormPages.Page>
          <Question
            title="Imię i nazwisko"
            label="Podaj swoje imię i nazwisko"
            field={
              <Controller
                name="shortText"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <ShortTextField
                    {...field}
                    required
                    error={touchedFields.shortText && errors.shortText?.message}
                  />
                )}
                rules={{ required: "Pole jest wymagane" }}
              />
            }
          />
          <Question
            title="Jak zmieniają się Twoje odczucia podczas słuchania?"
            label="Przesuwaj suwak w trakcie odtwarzania, aby zaznaczyć swoje odczucia."
            field={
              <Controller
                name="audioSlider"
                control={control}
                defaultValue={[]}
                render={({ field: { onChange, value, ...rest } }) => (
                  <AudioSliderField
                    audioSrc="/audio/audio1.mp3"
                    min={0}
                    max={1000}
                    step={10}
                    label="Intensywność odczuć"
                    onChange={onChange}
                    value={value}
                    {...rest}
                  />
                )}
                rules={{ required: "Pole jest wymagane" }}
              />
            }
          />
          <Question
            title="Opis doświadczenia muzycznego"
            label="Opisz swoje doświadczenie muzyczne"
            field={
              <Controller
                name="longText"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <LongTextField
                    {...field}
                    error={touchedFields.longText && errors.longText?.message}
                  />
                )}
              />
            }
          />
        </FormPages.Page>
        <FormPages.Page>
          <Question
            title="Wybierz instrument"
            label="Instrument"
            field={
              <Controller
                name="instrument"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <SelectField
                    options={["Fortepian", "Skrzypce", "Gitara"]}
                    {...field}
                    required
                    error={
                      touchedFields.instrument && errors.instrument?.message
                    }
                  />
                )}
                rules={{ required: "Pole jest wymagane" }}
              />
            }
          />
          <Question
            title="Wybierz ulubione style muzyczne"
            label="Style muzyczne"
            field={
              <Controller
                name="styles"
                control={control}
                defaultValue={[]}
                render={({ field, fieldState }) => (
                  <MultiSelectField
                    options={["Jazz", "Rock", "Klasyczna"]}
                    {...field}
                    required
                    error={touchedFields.styles && errors.styles?.message}
                  />
                )}
                rules={{ required: "Pole jest wymagane" }}
              />
            }
          />
        </FormPages.Page>
        <FormPages.Page>
          <Question
            title="Wybierz miasto lub wpisz własne"
            label="Miasto"
            field={
              <Controller
                name="city"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <SelectWithOwnField
                    options={["Wrocław", "Warszawa", "Kraków"]}
                    {...field}
                    required
                    error={touchedFields.city && errors.city?.message}
                  />
                )}
                rules={{ required: "Pole jest wymagane" }}
              />
            }
          />
          <Question
            title="Wybierz ulubione kompozytorki/kompozytorów lub wpisz własnych"
            label="Kompozytorki/Kompozytorzy"
            field={
              <Controller
                name="composers"
                control={control}
                defaultValue={[]}
                render={({ field, fieldState }) => (
                  <MultiSelectWithOwnField
                    options={["Chopin", "Bacewicz", "Penderecki"]}
                    {...field}
                  />
                )}
              />
            }
          />
        </FormPages.Page>
        <FormPages.Confirmation />
      </FormPages>
    </motion.div>
  );
}
