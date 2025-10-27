import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import "./main.css";

interface AnimatedPageProps {
  title: string | React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  onTransitionFinished?: () => void;
  backgroundClassName?: string;
  darkFont?: boolean;
}

export default function AnimatedPage({
  title,
  subtitle,
  children,
  onTransitionFinished,
  backgroundClassName = "page-dark",
  darkFont = false,
}: AnimatedPageProps) {
  const [visible, setVisible] = useState(false);
  const [grow, setGrow] = useState(1);
  const [showContent, setShowContent] = useState(false);

  const titleColor = darkFont ? "text-black" : "text-white";
  const subtitleColor = darkFont ? "text-gray-700" : "text-gray-400";

  useEffect(() => {
    // Fade in
    const fadeTimeout = setTimeout(() => setVisible(true), 50);
    // After fade in and 1s break, animate flex-grow
    const growTimeout = setTimeout(() => setGrow(0), 1700);
    // After flex-grow transition, show content
    const showContentTimeout = setTimeout(() => {
      setShowContent(true);
      onTransitionFinished?.();
    }, 1700 + 600); // 0.5s flexGrow + 0.1s buffer

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(growTimeout);
      clearTimeout(showContentTimeout);
    };
  }, [onTransitionFinished]);

  return (
    <div
      className={`page-screen ${backgroundClassName} p-8 flex flex-col min-h-screen w-full relative overflow-hidden`}
    >
      <motion.div
        style={{
          flexGrow: grow,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        animate={{ flexGrow: grow }}
        transition={{ flexGrow: { duration: 0.5, ease: "easeIn" } }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.7, ease: "easeIn" }}
        >
          <h1 className={`text-4xl font-bold ${titleColor}`}>{title}</h1>
          {subtitle && (
            <span className={`break-all  font-serif text-lg ${subtitleColor}`}>
              {subtitle}
            </span>
          )}
        </motion.div>
      </motion.div>
      <div
        className={`pt-4 program list grow overflow-y-auto relative ${
          showContent ? "visible" : "hidden"
        }`}
      >
        {showContent && children}
      </div>
    </div>
  );
}
