import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

import "./main.css"; // Import your main CSS file
export default function Page() {
  const [visible, setVisible] = useState(false);
  const [grow, setGrow] = useState(1);
  const [showCompositions, setShowCompositions] = useState(false);
  const [compositionsAnimated, setCompositionsAnimated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Fade in
    const fadeTimeout = setTimeout(() => setVisible(true), 50);
    // After fade in and 1s break, animate flex-grow
    const growTimeout = setTimeout(() => setGrow(0), 1700);
    // After flex-grow transition, show compositions
    const showCompositionsTimeout = setTimeout(
      () => setShowCompositions(true),
      1700 + 600
    ); // 0.5s flexGrow + 0.1s buffer
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(growTimeout);
      clearTimeout(showCompositionsTimeout);
    };
  }, []);

  function Composition({
    composer,
    title,
    performers,
    first = false,
  }: {
    composer: string;
    title: string;
    performers: string[];
    first?: boolean;
  }) {
    return (
      <div className="card bg-card/0 backdrop-blur-sm shadow-sm p-4  flex flex-col gap-2 shadow-md border-0 border-x-0 border-gray-200/30">
        <>
          <span
            data-title="composer"
            className="text-gray-50 font-serif font-thin text-xl"
          >
            {composer}
          </span>

          <span data-title="piece" className="font-sans italic">
            {title}
          </span>
          <span className="flex ">
            <span className="font-serif ">Wyk. &nbsp;&nbsp;</span>
            <span className="text-sm flex flex-col">
              {performers.map((performer, index) => (
                <span key={index}>{performer}</span>
              ))}
            </span>
          </span>
        </>
      </div>
    );
  }

  // List of compositions
  const compositions = [
    {
      composer: "Ludwig van Beethoven",
      title: "Symphony No. 9 in D minor, Op. 125",
      performers: [
        "Filharmonia Wrocławska - orkiestra",
        "Jan Kowalski - dyrygent",
      ],
    },
    {
      composer: "Fryderyk Chopin",
      title: "Piano Concerto No. 1 in E minor, Op. 11",
      performers: [
        "Anna Nowak - fortepian",
        "Orkiestra Symfoniczna Polskiego Radia",
      ],
    },
    {
      composer: "Witold Lutosławski",
      title: "Concerto for Orchestra",
      performers: ["Orkiestra Narodowa", "Piotr Zieliński - dyrygent"],
    },
    {
      composer: "Karol Szymanowski",
      title: "Stabat Mater, Op. 53",
      performers: [
        "Chór Akademicki Politechniki Wrocławskiej",
        "Orkiestra Filharmonii Narodowej",
      ],
    },
    {
      composer: "Henryk Mikołaj Górecki",
      title: "Symphony No. 3, Op. 36 'Symphony of Sorrowful Songs'",
      performers: [
        "Maria Wiśniewska - sopran",
        "Orkiestra Kameralna Wratislavia",
      ],
    },
  ];

  return (
    <div className="page-screen page-dark p-8  flex flex-col min-h-screen w-full relative overflow-hidden">
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
          <h1 className="text-4xl font-bold ">Koncert Kompozytorski</h1>
          <span className="break-all text-gray-400 font-serif text-lg">
            Pożegnanie lata podczas deszczowego wieczoru z muzyką
          </span>
        </motion.div>
      </motion.div>
      <div
        className={`pt-4 program list grow overflow-y-auto relative ${
          showCompositions ? "visible" : "hidden"
        }`}
        style={{
          height: `${compositions.length * 120 + 40}px`,
          minHeight: "300px",
        }}
      >
        {showCompositions && (
          <>
            {compositions.map((comp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2 + i * 0.15,
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className="group mb-8"
                style={{ cursor: "pointer" }}
              >
                <div className="group-hover:shadow-2xl transition-shadow duration-200">
                  <Composition {...comp} first={i === 0} />
                </div>
              </motion.div>
            ))}
            <div className="h-8"></div>
          </>
        )}
      </div>
    </div>
  );
}
