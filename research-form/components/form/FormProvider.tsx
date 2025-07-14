import React from "react";
import { useForm, FormProvider as RHFProvider } from "react-hook-form";

export function FormProvider({
  children,
  defaultValues = {},
  disabled = false,
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  disabled?: boolean;
}) {
  const methods = useForm({ mode: "onChange", defaultValues, disabled });

  // Note: Preventing reload/navigation is not reliable on mobile browsers (iOS/Android).
  // This will show a warning dialog on desktop and some Android browsers only.
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (methods.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    // pagehide is fired on mobile browsers when navigating away or closing tab
    const handlePageHide = (e: PageTransitionEvent) => {
      if (methods.formState.isDirty) {
        // No reliable way to block, but can show a message in some browsers
        e.preventDefault?.();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [methods.formState.isDirty]);

  return <RHFProvider {...methods}>{children}</RHFProvider>;
}

export { useFormContext } from "react-hook-form";
