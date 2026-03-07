"use client";

import { motion } from "framer-motion";
import { getColor } from "@/lib/colors";

interface Winner {
  number: number;
  color: string;
  prize: string;
  revealedAt: number;
}

interface WinnerRevealProps {
  winner: Winner;
  index: number;
  animate?: boolean;
}

export default function WinnerReveal({
  winner,
  index,
  animate = true,
}: WinnerRevealProps) {
  const color = getColor(winner.color);

  const content = (
    <div
      className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
      style={{ borderColor: color.hex + "60" }}
    >
      {/* Position badge */}
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-sm sm:text-base shrink-0 border border-brand-gold/30">
        #{index + 1}
      </div>

      {/* Winner info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
            style={{ backgroundColor: color.hex }}
          />
          <span className="text-base sm:text-lg font-bold text-brand-text">
            #{winner.number}
          </span>
          <span className="text-xs sm:text-sm font-medium" style={{ color: color.hex }}>
            {winner.color}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-brand-muted mt-0.5 truncate">{winner.prize}</p>
      </div>

      {/* Trophy */}
      <div className="text-brand-gold text-lg sm:text-2xl shrink-0">
        {index === 0 ? "\u{1F3C6}" : index === 1 ? "\u{1F948}" : index === 2 ? "\u{1F949}" : "\u2B50"}
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.2,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    >
      {content}
    </motion.div>
  );
}
