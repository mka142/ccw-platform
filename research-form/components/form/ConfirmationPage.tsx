import React from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import "./confirmation-shine.css";

const ConfirmationPage = ({ confetti = true }: { confetti?: boolean }) => {
  // Get window size for confetti
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  React.useEffect(() => {
    function update() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center min-h-[300px] py-12"
    >
      {confetti && (
        <div className="fixed top-0 left-0 z-50 b-0 w-full h-full pointer-events-none overflow-hidden">
          {/* Render confetti only if enabled */}
          <Confetti
            width={dimensions.width}
            height={dimensions.height}
            numberOfPieces={250}
            recycle={false}
          />
        </div>
      )}
      <motion.h2
        className="text-3xl font-bold mb-4 text-center shine-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <span className="shine-inner">
          Dziękujemy za wypełnienie formularza!
        </span>
      </motion.h2>
      <p className="mb-4 text-lg text-center max-w-xl">
        Twoje odpowiedzi zostały zapisane 🎉 Zachęcamy do udostępnienia tego
        badania innym osobom:
        <br />
        <span className="inline-flex items-center gap-2 justify-center mt-2">
          <a
            href={
              typeof window !== "undefined"
                ? window.location.origin
                : "https://ccw.mka.wroclaw.pl"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-orange-800 dark:text-orange-400 hover:text-orange-600 break-all select-all px-1"
            style={{ fontSize: "1rem" }}
          >
            {typeof window !== "undefined"
              ? window.location.origin
              : "https://ccw.mka.wroclaw.pl"}
          </a>
        </span>
        <br />
        im więcej odpowiedzi, tym lepiej!
      </p>
      <p className="text-center text-gray-500 dark:text-gray-300">
        Możesz zamknąć tę stronę lub wrócić na stronę główną.
      </p>
    </motion.div>
  );
};

export default ConfirmationPage;
