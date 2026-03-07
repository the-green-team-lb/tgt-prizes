"use client";

import { useState, useEffect, useRef } from "react";
import { useDrawById } from "@/lib/use-local-store";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "next/navigation";
import PrizeWheel from "@/components/PrizeWheel";
import ProvablyFair from "@/components/ProvablyFair";
import WinnerReveal from "@/components/WinnerReveal";
import Link from "next/link";
import { getColor } from "@/lib/colors";

export default function DrawDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const draw = useDrawById(id);
  const incrementView = useMutation(api.drawMutations.incrementDrawHistoryViewCount);
  const counted = useRef(false);

  useEffect(() => {
    if (draw && !counted.current) {
      counted.current = true;
      incrementView({ drawId: draw._id as any });
    }
  }, [draw, incrementView]);

  if (draw === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-muted mt-4">Loading draw...</p>
        </div>
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-brand-muted text-lg">Draw Not Found</p>
          <Link
            href="/draws"
            className="text-brand-gold text-sm mt-4 inline-block hover:text-brand-gold/80"
          >
            &larr; Back to All Draws
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/draws"
        className="text-sm text-brand-muted hover:text-brand-gold transition-colors mb-6 inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to All Draws
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-brand-text">{draw.title}</h1>
        {(draw as any).viewCount > 0 && (
          <span className="text-brand-muted text-sm">
            <span className="text-brand-gold font-semibold">{(draw as any).viewCount}</span> views
          </span>
        )}
      </div>
      <p className="text-brand-muted mb-8">
        Completed: {new Date(draw.completedAt).toLocaleDateString("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", year: "numeric" })} | {draw.participatingNumbers.length} Entries | {draw.winners.length} Winners
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wheel Replay (replaces video) */}
        <div className="lg:col-span-2">
          <WheelReplay
            numbers={draw.participatingNumbers}
            winners={draw.winners}
          />
        </div>

        {/* Winners */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
              <h3 className="text-brand-dark font-bold">Winners</h3>
            </div>
            <div className="p-4 space-y-2">
              {draw.winners.map((winner, i) => (
                <WinnerReveal
                  key={i}
                  winner={winner}
                  index={i}
                  animate={false}
                />
              ))}
            </div>
          </div>

          {/* Prizes */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="bg-brand-green/50 px-5 py-3">
              <h3 className="text-brand-text font-bold">Prizes</h3>
            </div>
            <div className="p-4 space-y-2">
              {draw.prizes.map((prize, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xs font-bold border border-brand-gold/30">
                    {i + 1}
                  </span>
                  <span className="text-brand-text/80">{prize}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Draw Note */}
          {(draw as any).drawNote && (
            <div className="glass-card rounded-2xl overflow-hidden border-brand-gold/30">
              <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
                <h3 className="text-brand-dark font-bold text-center text-lg">{(draw as any).drawNote}</h3>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raffle Link */}
      {draw.raffleLink && (
        <div className="glass-card rounded-2xl mt-6 overflow-hidden">
          <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
            <h3 className="text-brand-text font-bold"><a href="https://littlebiggy.net/viewSubject/p/4775239" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors">LittleBiggy</a> Post</h3>
          </div>
          <div className="p-5">
            <a
              href={draw.raffleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all"
            >
              View Competition
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Ticket Image */}
      {(draw as any).ticketImageUrl && (
        <div className="glass-card rounded-2xl mt-6 overflow-hidden">
          <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
            <h3 className="text-brand-text font-bold">Ticket Reference</h3>
          </div>
          <div className="p-5">
            <img src={(draw as any).ticketImageUrl} alt="Raffle Ticket" className="max-w-full max-h-48 rounded-lg bg-white" />
          </div>
        </div>
      )}

      {/* Serial Numbers */}
      {draw.serialNumbers && (
        <div className="glass-card rounded-2xl mt-6 overflow-hidden">
          <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
            <h3 className="text-brand-text font-bold">Serial Numbers Record</h3>
          </div>
          <div className="p-5">
            <p className="text-brand-muted text-sm font-mono whitespace-pre-wrap break-all bg-brand-card p-4 rounded-lg border border-brand-border">
              {draw.serialNumbers}
            </p>
          </div>
        </div>
      )}

      {/* Provably Fair Verification */}
      <div className="mt-8">
        <ProvablyFair
          publicHash={draw.publicHash}
          serverSeed={draw.serverSeed}
          numbers={draw.participatingNumbers}
          isCompleted={true}
        />
      </div>

      {/* All Numbers */}
      <div className="glass-card rounded-2xl mt-8 overflow-hidden">
        <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
          <h3 className="text-brand-text font-bold">All Participating Numbers ({draw.participatingNumbers.length})</h3>
        </div>
        <div className="p-4 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-64 overflow-y-auto">
          {draw.participatingNumbers.map((entry, i) => {
            const color = getColor(entry.color);
            const isWinner = draw.winners.some(
              (w) => w.number === entry.number
            );
            return (
              <div
                key={i}
                className={`text-xs px-1.5 py-1 rounded text-center font-mono ${
                  isWinner
                    ? "ring-2 ring-brand-gold bg-brand-gold/20 text-brand-gold font-bold"
                    : "bg-brand-card text-brand-muted"
                }`}
                style={{ borderLeft: `3px solid ${color.hex}` }}
              >
                {entry.number}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Wheel Replay — shows wheel with Replay button to animate through all winners.
 */
function WheelReplay({
  numbers,
  winners,
}: {
  numbers: { number: number; color: string }[];
  winners: { number: number; color: string; prize: string; revealedAt: number }[];
}) {
  const [replaying, setReplaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentWinner = currentIdx >= 0 && currentIdx < winners.length ? winners[currentIdx] : null;

  // Auto-advance through winners during replay
  useEffect(() => {
    if (!replaying) return;

    if (currentIdx < 0) {
      // Start first winner
      setCurrentIdx(0);
      setSpinTrigger((p) => p + 1);
      return;
    }

    if (currentIdx >= winners.length) {
      // Done
      setReplaying(false);
      return;
    }

    // Wait for spin + display, then next
    timerRef.current = setTimeout(() => {
      const nextIdx = currentIdx + 1;
      if (nextIdx < winners.length) {
        setCurrentIdx(nextIdx);
        setSpinTrigger((p) => p + 1);
      } else {
        setReplaying(false);
      }
    }, 5000); // 3s spin + 2s show

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIdx, replaying, winners.length]);

  const handleReplay = () => {
    setCurrentIdx(-1);
    setReplaying(true);
  };

  const handleStop = () => {
    setReplaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
        <h3 className="text-brand-dark font-bold">Draw Replay</h3>
      </div>
      <div className="p-6 sm:p-8">
        <PrizeWheel
          numbers={numbers}
          winner={currentWinner}
          spinTrigger={spinTrigger}
        />

        {/* Replay controls */}
        <div className="mt-6 text-center">
          {replaying ? (
            <div className="space-y-2">
              <p className="text-sm text-brand-gold font-medium animate-pulse">
                Replaying Winner {Math.min(currentIdx + 1, winners.length)} of {winners.length}...
              </p>
              <button
                onClick={handleStop}
                className="text-xs text-brand-muted hover:text-brand-gold transition-colors"
              >
                Stop Replay
              </button>
            </div>
          ) : (
            <button
              onClick={handleReplay}
              className="bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all"
            >
              Replay Draw
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
