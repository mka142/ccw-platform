import React, {
  useState,
  useEffect,
  Children,
  ReactElement,
  cloneElement,
} from "react";
import dynamic from "next/dynamic";
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
  onFinish?: () => boolean | Promise<boolean>;
}

interface FormPageProps {
  children: React.ReactNode;
}

// Single page wrapper
function Page({ children }: FormPageProps) {
  return <div>{children}</div>;
}

// Aggregator for multi-page forms
function FormPages({
  children,
  nextLabel = "Dalej",
  prevLabel = "Wstecz",
  onFinish,
  confetti = true,
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

  // Hide button, then animate form, then show button with stagger
  const handleNext = async () => {
    // Validate current page fields before allowing next
    if (form && form.trigger) {
      // Find all field names on this page
      const pageFields: string[] = [];
      const pageChildren = pages[page] as ReactElement<{
        children: React.ReactNode;
      }>;
      React.Children.forEach(pageChildren.props.children, (child) => {
        if (
          React.isValidElement(child) &&
          child.type === Question &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child.props as { field?: any }).field?.props?.name
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pageFields.push((child.props as { field: any }).field.props.name);
        }
      });
      const valid = await form.trigger(pageFields);
      if (!valid) {
        // Find which fields are invalid
        const missing = pageFields.filter(
          (field) => form.formState.errors[field]
        );
        setPageErrorFields(missing);
        return;
      } else {
        setPageErrorFields([]);
      }
    }
    if (isLast && hasConfirmation) {
      setLoading(true);
      let success = true;
      if (onFinish) {
        try {
          const result = await onFinish();
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
    }
  };
  const handlePrev = () => {
    setShowButton(false);
    setPendingPage(page - 1);
    setPendingDirection(-1);
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
      (pages[page] as ReactElement<{ children: React.ReactNode }>).props
        .children,
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
                  className="flex gap-2 justify-end mt-4"
                >
                  {!isFirst && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      onClick={handlePrev}
                    >
                      {prevLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-orange-800 text-white hover:bg-orange-600 transition-colors font-semibold flex items-center gap-2"
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
