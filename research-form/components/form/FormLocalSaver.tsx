"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

const useIsWindow = () => {
  const [isWindow, setIsWindow] = useState(false);
  useEffect(() => {
    setIsWindow(typeof window !== "undefined");
  }, []);
  return isWindow;
};
/**
 * FormLocalSaver
 * Saves form data to localStorage and restores it on mount.
 * Usage: <FormLocalSaver storageKey="my-form" /> inside your form provider.
 */
export function FormLocalSaver({
  storageKey = "form-data",
}: {
  storageKey?: string;
}) {
  const form = useFormContext();

  // Restore form data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const values = JSON.parse(saved);
        form.reset(values);
      } catch {}
    }
  }, [storageKey, form.reset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save form data on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const subscription = form.watch((values) => {
      localStorage.setItem(storageKey, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [storageKey, form.watch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optionally clear localStorage on submit
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (form.formState.isSubmitSuccessful) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, form.formState.isSubmitSuccessful]);

  return null;
}

export function FormLocalSaverResetButton({
  storageKey = "form-data",
}: {
  storageKey?: string;
}) {
  // show if there is data in localStorage. on click remove data and reload the page
  const isWindow = useIsWindow();

  const handleReset = () => {
    if (!isWindow) return;
    const confirmReset = window.confirm(
      "Czy na pewno chcesz wyczyścić lokalny zapis formularza? Spowoduje to utratę wszystkich niezapisanych danych."
    );
    if (!confirmReset) return;
    // Clear localStorage and reload the page
    localStorage.removeItem(storageKey);
    window.location.reload();
  };

  if (!isWindow) return null;
  if (!localStorage.getItem(storageKey)) {
    return null; // Don't show button if no data exists
  }

  return (
    <div>
      <p>
        Wykorzystujesz lokalny zapis formularza. Jeśli chcesz wypełnić formularz
        od nowa,{" "}
        <button
          onClick={handleReset}
          className="text-red-500 font-bold hover:underline"
        >
          wyczyść
        </button>{" "}
        lokalny zapis.
      </p>
    </div>
  );
}
