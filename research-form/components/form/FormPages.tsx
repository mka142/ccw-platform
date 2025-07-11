import React, {
  useState,
  useEffect,
  Children,
  ReactElement,
  cloneElement,
  useCallback,
} from "react";
import dynamic from "next/dynamic";

export interface FormResponseSchema {
  [key: string]: unknown;
}

// Dynamically import ConfirmationPage to avoid SSR issues with window
const ConfirmationPage = dynamic(() => import("./ConfirmationPage"), {
  ssr: false,
});

// Special marker for confirmation page
function Confirmation({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { Question } from "./Question";

interface FormPagesProps {
  children: React.ReactNode;
  nextLabel?: string;
  prevLabel?: string;
  onFinish?: (data: FormResponseSchema) => boolean | Promise<boolean>;
  onPageChange?: (pageIndex: number) => void; // Callback for page change
}

interface FormPageProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

interface ReactElementWithChildren extends ReactElement {
  props: {
    children: React.ReactNode;
  };
}

// Single page wrapper
function Page({ children, title = "", description = "" }: FormPageProps) {
  return (
    <div>
      <div className="pb-3 mt-1">
        {title && (
          <h2 className="text-2xl font-medium font-serif text-primary/80">
            {title}
          </h2>
        )}
        {description && (
          <span dangerouslySetInnerHTML={{ __html: description }} />
        )}
      </div>
      {children}
    </div>
  );
}

// Aggregator for multi-page forms
function FormPages({
  children,
  nextLabel = "Dalej",
  prevLabel = "Wstecz",
  onFinish,
  confetti = true,
  onPageChange = () => {}, // Callback for page change
}: FormPagesProps & { confetti?: boolean }) {
  // Split children into pages and find confirmation page
  const form = useFormContext();
  const allChildren = Children.toArray(children).filter(
    Boolean
  ) as ReactElement[];
  const confirmationIndex = allChildren.findIndex(
    (el) =>
      el.type &&
      (el.type as { displayName?: string }).displayName ===
        "FormPagesConfirmation"
  );
  const hasConfirmation = confirmationIndex !== -1;
  const pages = hasConfirmation
    ? allChildren.slice(0, confirmationIndex)
    : allChildren;
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev
  const [showButton, setShowButton] = useState(true);
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [pendingDirection, setPendingDirection] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pageErrorFields, setPageErrorFields] = useState<string[]>([]);
  const pageTransitionDuration = 0.5; // seconds for framer-motion
  const buttonStagger = 0.2; // seconds, delay after form animates in

  const isLast = page === pages.length - 1;
  const isFirst = page === 0;

  const getFormPageChildren = (pageChildren: ReactElementWithChildren) => {
    // check if pageChildren is FormPages.Page type
    // if it is React.Fragment we assume that there was a mapping done, so we try
    // to access the children of that React.Fragment. It it's not FormPages.Page type raise error
    if (pageChildren.type === FormPages.Page) {
      return pageChildren.props.children;
    }
    if (pageChildren.type === React.Fragment) {
      if (pageChildren.props.children) {
        const _children = pageChildren.props.children;
        if (
          React.isValidElement(_children) &&
          _children.type === FormPages.Page
        ) {
          return (_children as ReactElementWithChildren).props.children;
        }
      }
      throw new Error(
        `Invalid FormPages.Page children structure. Expected FormPages.Page or React.Fragment with children, got ${
          pageChildren.type.name || pageChildren.type
        }`
      );
    }
    throw new Error(
      "Invalid FormPages.Page children structure. Expected FormPages.Page or React.Fragment."
    );
  };

  const getPageFields = useCallback(() => {
    const pageChildren = pages[page] as ReactElementWithChildren;
    const fields: string[] = [];
    React.Children.forEach(getFormPageChildren(pageChildren), (child) => {
      if (
        React.isValidElement(child) &&
        child.type === Question &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (child.props as { field?: any }).field?.props?.name
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fields.push((child.props as { field: any }).field.props.name);
      }
    });

    return fields;
  }, [pages, page]);

  useEffect(() => {
    // Find which fields are invalid
    const missing = getPageFields().filter(
      (field) => form.formState.errors[field]
    );
    // Set error fields to show in UI
    if (missing !== pageErrorFields) {
      setPageErrorFields(missing);
    }
  }, [JSON.stringify(Object.keys(form.formState.errors))]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide button, then animate form, then show button with stagger
  const handleNext = async () => {
    // Validate current page fields before allowing next
    if (form && form.trigger) {
      // Find all field names on this page
      const pageFields = getPageFields();
      const valid = await form.trigger(pageFields);
      if (!valid) {
        return;
      } else {
        await form.clearErrors();
      }
    }
    if (isLast && hasConfirmation) {
      setLoading(true);
      let success = true;
      if (onFinish) {
        try {
          const result = await onFinish(form.getValues());
          if (result === false) success = false;
        } catch {
          success = false;
        }
      } else {
        await new Promise((res) => setTimeout(res, 1200));
      }
      setLoading(false);
      if (success) setShowConfirmation(true);
    } else if (!isLast) {
      setShowButton(false);
      setPendingPage(page + 1);
      setPendingDirection(1);
      onPageChange(page + 1); // Call the page change callback
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handlePrev = () => {
    setShowButton(false);
    setPendingPage(page - 1);
    setPendingDirection(-1);
    onPageChange(page - 1); // Call the page change callback
  };

  // When pendingPage is set, change page after button fade out
  useEffect(() => {
    if (pendingPage !== null) {
      const timeout = setTimeout(() => {
        setDirection(pendingDirection);
        setPage(pendingPage);
      }, 200); // match button fade out
      return () => clearTimeout(timeout);
    }
  }, [pendingPage, pendingDirection]);

  // When page changes, show button after form transition and a stagger
  useEffect(() => {
    if (pendingPage !== null && page === pendingPage) {
      const timeout = setTimeout(() => {
        setShowButton(true);
        setPendingPage(null);
      }, (pageTransitionDuration + buttonStagger) * 1000);
      return () => clearTimeout(timeout);
    }
  }, [page, pendingPage]);

  // Animation variants for page transitions
  const parentVariant = {
    initial: { opacity: 1 },
    animate: { opacity: 1, transition: { staggerChildren: 0.08 } },
    exit: { opacity: 1 },
  };
  const pageVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative" as const,
      width: "100%",
      transition: { duration: pageTransitionDuration, ease: "easeInOut" },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
      transition: { duration: pageTransitionDuration, ease: "easeInOut" },
    }),
  };

  // Helper: get field name to title mapping for current page
  function getFieldNameToTitleMap() {
    const map: Record<string, string> = {};
    React.Children.forEach(
      getFormPageChildren(pages[page] as ReactElementWithChildren),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => {
        if (child?.props?.field?.props?.name && child?.props?.title) {
          map[child.props.field.props.name] = child.props.title;
        }
      }
    );
    return map;
  }

  return (
    <div className="flex flex-col gap-6 relative min-h-[300px]">
      {/* Show confirmation page if needed */}
      {showConfirmation && hasConfirmation ? (
        <ConfirmationPage confetti={confetti} />
      ) : (
        <>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={page}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Stagger children inside the page for nice effect */}
              <motion.div
                variants={parentVariant}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {cloneElement(pages[page])}
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {/* Animate the button row separately so it can fade out before the form page */}
          <AnimatePresence mode="wait" initial={false}>
            {showButton && (
              <>
                {pageErrorFields.length > 0 && (
                  <div className="mb-2 text-red-600 text-sm">
                    Proszę uzupełnić następujące pola:
                    <br />
                    <ul className="list-disc ml-6">
                      {pageErrorFields.map((field) => {
                        const fieldMap = getFieldNameToTitleMap();
                        return <li key={field}>{fieldMap[field] || field}</li>;
                      })}
                    </ul>
                  </div>
                )}
                <motion.div
                  key={page + "-btns"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: 20,
                    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="flex gap-2 justify-end mt-4 pb-4"
                  style={{ width: "100%" }}
                >
                  {!isFirst && (
                    <button
                      type="button"
                      className="hover:cursor-pointer px-6 py-3 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-base sm:text-lg w-full sm:w-auto"
                      onClick={handlePrev}
                    >
                      {prevLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className="hover:cursor-pointer px-6 py-3 rounded bg-orange-800 text-white hover:bg-orange-600 transition-colors font-semibold flex items-center gap-2 text-base sm:text-lg w-full sm:w-auto"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    {loading && (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    )}
                    {isLast
                      ? loading
                        ? "Wysyłanie..."
                        : "Prześlij formularz"
                      : nextLabel}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

FormPages.Page = Page;
FormPages.Confirmation = Confirmation;
Confirmation.displayName = "FormPagesConfirmation";

export default FormPages;
