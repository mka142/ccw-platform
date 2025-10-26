import React from "react";
import { motion } from "framer-motion";

interface Sponsor {
  name: string;
  logo: string;
  width?: number;
}

// import images directly
import amklLogo from "@/public/logo/amkl.png";
import kannmLogo from "@/public/logo/kannm.png";
import knakitmLogo from "@/public/logo/knakitm.png";
import sknmLogo from "@/public/logo/sknm.png";
import wcaLogo from "@/public/logo/wca-v2-cropped.png";
import wroclawLogo from "@/public/logo/wroclaw.png";

// Add your sponsor logo filenames from the public folder
// Example: if you have /public/sponsors/logo1.png, use "sponsors/logo1.png"
const sponsors: Sponsor[] = [
  { name: "AMKL", logo: amklLogo, width: 300 },
  { name: "KNAKITM", logo: knakitmLogo, width: 300 },
  { name: "WCA", logo: wcaLogo, width: 300 },
  { name: "KANNM", logo: kannmLogo, width: 300 },
  { name: "SKNM", logo: sknmLogo, width: 170 },
  { name: "Wrocław", logo: wroclawLogo, width: 300 },
];

interface SponsorsCarouselProps {
  sponsorData?: Sponsor[];
  speed?: number; // duration in seconds for one complete loop
}

export default function SponsorsCarousel({
  sponsorData = sponsors,
  speed = 30,
}: SponsorsCarouselProps) {
  const GAP = 48; // gap-12 in Tailwind is 3rem = 48px

  // Calculate total width including gaps
  const totalWidth = sponsorData.reduce(
    (sum, sponsor) => sum + (sponsor.width || 200) + GAP,
    0
  );

  // Triple the sponsors array to ensure seamless infinite loop
  const duplicatedSponsors = [...sponsorData, ...sponsorData, ...sponsorData];

  return (
    <div className="w-full overflow-hidden bg-white/5 py-2">
      <motion.div
        className="flex gap-12 items-center"
        animate={{
          x: [0, -totalWidth],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{ width: "fit-content" }}
      >
        {duplicatedSponsors.map((sponsor, index) => (
          <img
            key={index}
            src={sponsor.logo}
            alt={sponsor.name}
            className="h-18 object-contain opacity-60 hover:opacity-100 transition-opacity max-h-24 active:opacity-100 user-select-none"
            style={{
              width: sponsor.width ? `${sponsor.width}px` : "200px",
              flexShrink: 0,
              height: "auto",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
