"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { getColor } from "@/lib/colors";

interface NumberEntry {
  number: number;
  color: string;
}

interface PrizeWheelProps {
  numbers: NumberEntry[];
  isSpinning?: boolean;
  winner?: NumberEntry | null;
  spinTrigger?: number;
}

export default function PrizeWheel({
  numbers,
  isSpinning = false,
  winner,
  spinTrigger = 0,
}: PrizeWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const lastTrigger = useRef(0);
  const initialSpinDone = useRef(false);
  const winnerTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Max 24 segments, ensure winner is visible
  const segments = useMemo(() => {
    if (numbers.length === 0) return [];
    const displayCount = Math.min(numbers.length, 24);
    const step = Math.max(1, Math.floor(numbers.length / displayCount));
    const segs: NumberEntry[] = [];
    for (let i = 0; i < displayCount; i++) {
      const idx = i * step;
      if (idx < numbers.length) segs.push(numbers[idx]);
    }
    if (winner) {
      const found = segs.some(
        (s) => s.number === winner.number && s.color === winner.color
      );
      if (!found && segs.length > 2) {
        segs[Math.floor(segs.length / 2)] = winner;
      }
    }
    return segs;
  }, [numbers, winner]);

  const segmentAngle = segments.length > 0 ? 360 / segments.length : 360;

  // Targeted spin to winner — 3 seconds
  useEffect(() => {
    if (spinTrigger > lastTrigger.current && winner && segments.length > 0) {
      lastTrigger.current = spinTrigger;
      setShowWinner(false);
      setSpinning(true);

      let targetIdx = segments.findIndex(
        (s) => s.number === winner.number && s.color === winner.color
      );
      if (targetIdx === -1)
        targetIdx = segments.findIndex((s) => s.number === winner.number);
      if (targetIdx === -1) targetIdx = 0;

      const targetCenter = targetIdx * segmentAngle + segmentAngle / 2;
      // Pointer is at top (0°). When wheel rotates θ° clockwise,
      // the segment originally at θ° moves to 0° (under the pointer).
      // To land on targetCenter, we need rotation = 360 - targetCenter.
      const pointerAngle = (360 - targetCenter + 360) % 360;
      const spins = 5 + Math.floor(Math.random() * 3);
      const currentMod = ((rotation % 360) + 360) % 360;
      const needed = (((pointerAngle - currentMod) % 360) + 360) % 360;
      setRotation(rotation + spins * 360 + needed);

      if (winnerTimerRef.current) clearTimeout(winnerTimerRef.current);
      winnerTimerRef.current = setTimeout(() => {
        setSpinning(false);
        setShowWinner(true);
      }, 3500); // after 3s spin animation completes
    }
  }, [spinTrigger]);

  // Generic continuous spinning
  useEffect(() => {
    if (isSpinning && !initialSpinDone.current && !winner) {
      initialSpinDone.current = true;
      setSpinning(true);
      setRotation((prev) => prev + 100 * 360);
    }
    if (!isSpinning && !winner) {
      initialSpinDone.current = false;
    }
  }, [isSpinning, winner]);

  useEffect(() => {
    return () => {
      if (winnerTimerRef.current) clearTimeout(winnerTimerRef.current);
    };
  }, []);

  if (segments.length === 0) return null;

  return (
    <div className="relative w-full max-w-[320px] sm:max-w-md mx-auto">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 z-10">
        <div className="w-0 h-0 border-l-[10px] sm:border-l-[14px] border-l-transparent border-r-[10px] sm:border-r-[14px] border-r-transparent border-t-[18px] sm:border-t-[24px] border-t-brand-gold drop-shadow-lg" />
      </div>

      {/* Glow */}
      {spinning && (
        <div
          className="absolute inset-[-4px] rounded-full animate-pulse pointer-events-none"
          style={{
            boxShadow:
              "0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.15)",
          }}
        />
      )}

      {/* Wheel */}
      <motion.div
        className="w-full aspect-square rounded-full border-4 border-brand-gold/40 overflow-hidden relative shadow-2xl"
        animate={{ rotate: rotation }}
        transition={{
          duration: spinning ? 3 : 0.3,
          ease: spinning ? [0.12, 0.75, 0.2, 1] : "easeOut",
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map((entry, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            const startRad = ((startAngle - 90) * Math.PI) / 180;
            const endRad = ((endAngle - 90) * Math.PI) / 180;
            const x1 = 100 + 95 * Math.cos(startRad);
            const y1 = 100 + 95 * Math.sin(startRad);
            const x2 = 100 + 95 * Math.cos(endRad);
            const y2 = 100 + 95 * Math.sin(endRad);
            const largeArc = segmentAngle > 180 ? 1 : 0;
            const color = getColor(entry.color);
            const midAngle =
              (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
            const textX = 100 + 65 * Math.cos(midAngle);
            const textY = 100 + 65 * Math.sin(midAngle);
            const textRotation = (startAngle + endAngle) / 2;

            return (
              <g key={i}>
                <path
                  d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={color.hex}
                  stroke="#0a0a0f"
                  strokeWidth="0.5"
                  opacity={0.85}
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize={
                    segments.length > 16
                      ? "5"
                      : segments.length > 10
                        ? "6"
                        : "7"
                  }
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                >
                  {entry.number}
                </text>
              </g>
            );
          })}
          <circle
            cx="100"
            cy="100"
            r="18"
            fill="#0a0a0f"
            stroke="#FFD700"
            strokeWidth="2.5"
          />
          <text
            x="100"
            y="100"
            fill="#FFD700"
            fontSize="7"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            TGT-P
          </text>
        </svg>
      </motion.div>

      {/* Winner overlay */}
      {winner && showWinner && (
        <motion.div
          key={`win-${winner.number}-${spinTrigger}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
        >
          <div className="bg-brand-card/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center border-2 border-brand-gold/60 shadow-2xl gold-glow">
            <p className="text-xs sm:text-sm text-brand-gold font-bold tracking-wider">
              WINNER
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-brand-text mt-2">
              #{winner.number}
            </p>
            <p
              className="text-base sm:text-lg font-semibold mt-2"
              style={{ color: getColor(winner.color).hex }}
            >
              {winner.color}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
