"use client";

import { useRef, useEffect, useState } from "react";
import PrizeWheel from "./PrizeWheel";
import WinnerReveal from "./WinnerReveal";
import ProvablyFair from "./ProvablyFair";
import { getColor } from "@/lib/colors";

interface NumberEntry {
  number: number;
  color: string;
}

interface Winner {
  number: number;
  color: string;
  prize: string;
  revealedAt: number;
}

interface DrawState {
  _id: string;
  title: string;
  participatingNumbers: NumberEntry[];
  prizes: string[];
  winnersCount: number;
  drawStatus: "idle" | "locked" | "spinning" | "revealing" | "completed";
  winners: Winner[];
  serverSeed: string;
  publicHash: string;
  raffleLink?: string;
  ticketImageUrl?: string;
  scheduledAt?: number;
}

interface LiveDrawViewerProps {
  draw: DrawState;
}

export default function LiveDrawViewer({ draw }: LiveDrawViewerProps) {
  const prevWinnerCount = useRef(draw.winners.length);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);

  useEffect(() => {
    if (draw.winners.length > prevWinnerCount.current) {
      const latest = draw.winners[draw.winners.length - 1];
      setCurrentWinner(latest);
      setSpinTrigger((prev) => prev + 1);
    }
    prevWinnerCount.current = draw.winners.length;
  }, [draw.winners.length]);

  const isDrawActive =
    draw.drawStatus === "spinning" || draw.drawStatus === "revealing";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Title & Status */}
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-bold text-brand-text">
          {draw.title}
        </h2>
        {draw.scheduledAt && (
          <p className="text-sm text-brand-muted mt-1">
            {new Date(draw.scheduledAt).toLocaleDateString("en-GB", {
              timeZone: "Europe/London",
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })} at {new Date(draw.scheduledAt).toLocaleTimeString("en-GB", {
              timeZone: "Europe/London",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })} UK
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={draw.drawStatus} />
          <span className="text-xs sm:text-sm text-brand-muted">
            {draw.participatingNumbers.length} numbers - {draw.winnersCount} prizes
          </span>
        </div>

        {/* Raffle Image & Link */}
        {(draw.ticketImageUrl || draw.raffleLink) && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            {draw.ticketImageUrl && (
              <div className="mb-3 border border-brand-border rounded-xl p-2 inline-block">
                <img src={draw.ticketImageUrl} alt="Raffle Ticket" className="max-w-full max-h-48 rounded-lg bg-white" />
              </div>
            )}
            {draw.raffleLink && (
              <div>
                <a
                  href={draw.raffleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-gold text-sm hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Competition
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pre-draw: hash + numbers */}
      {(draw.drawStatus === "idle" || draw.drawStatus === "locked") && (
        <>
          {/* Show wheel preview */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <PrizeWheel
              numbers={draw.participatingNumbers}
              winner={null}
              spinTrigger={0}
            />
            <p className="text-center text-brand-muted text-xs sm:text-sm mt-4">
              {draw.drawStatus === "idle"
                ? "Waiting for draw to start..."
                : "Draw locked - starting soon!"}
            </p>
          </div>

          {draw.publicHash && (
            <ProvablyFair
              publicHash={draw.publicHash}
              serverSeed={draw.serverSeed}
              numbers={draw.participatingNumbers}
              isCompleted={false}
            />
          )}
        </>
      )}

      {/* Active draw: WHEEL is the star */}
      {isDrawActive && (
        <>
          <div className="glass-card rounded-2xl p-4 sm:p-8 border-brand-gold/30">
            <PrizeWheel
              numbers={draw.participatingNumbers}
              isSpinning={
                draw.drawStatus === "spinning" && draw.winners.length === 0
              }
              winner={currentWinner}
              spinTrigger={spinTrigger}
            />

            {/* Progress bar */}
            {draw.drawStatus === "revealing" && (
              <div className="mt-4 sm:mt-6">
                <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                  <span>Winners</span>
                  <span className="text-brand-gold font-medium">
                    {draw.winners.length} / {draw.winnersCount}
                  </span>
                </div>
                <div className="w-full h-2 sm:h-2.5 rounded-full bg-brand-card overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-gold to-amber-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${(draw.winners.length / draw.winnersCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {draw.drawStatus === "spinning" && draw.winners.length === 0 && (
              <p className="text-center text-brand-gold font-medium text-sm mt-4 animate-pulse">
                Spinning...
              </p>
            )}
          </div>

          {/* Winners revealed so far */}
          {draw.winners.length > 0 && (
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-medium text-brand-muted mb-3 sm:mb-4">
                Winners ({draw.winners.length} / {draw.winnersCount})
              </h3>
              <div className="space-y-2">
                {draw.winners.map((winner, i) => (
                  <WinnerReveal
                    key={`${winner.number}-${i}`}
                    winner={winner}
                    index={i}
                    animate={i === draw.winners.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Completed */}
      {draw.drawStatus === "completed" && (
        <>
          <div className="glass-card rounded-2xl p-4 sm:p-8 border-brand-gold/50 gold-glow">
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark text-sm font-bold">
                Draw Complete
              </span>
            </div>
            <PrizeWheel
              numbers={draw.participatingNumbers}
              winner={
                draw.winners.length > 0
                  ? draw.winners[draw.winners.length - 1]
                  : null
              }
              spinTrigger={0}
            />
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-brand-gold mb-4">
              All Winners
            </h3>
            <div className="space-y-2">
              {draw.winners.map((winner, i) => (
                <WinnerReveal
                  key={`${winner.number}-${i}`}
                  winner={winner}
                  index={i}
                  animate={false}
                />
              ))}
            </div>
          </div>

          <ProvablyFair
            publicHash={draw.publicHash}
            serverSeed={draw.serverSeed}
            numbers={draw.participatingNumbers}
            isCompleted={true}
          />
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DrawState["drawStatus"] }) {
  const styles = {
    idle: "bg-brand-card text-brand-muted",
    locked: "bg-brand-green/30 text-brand-green",
    spinning: "bg-brand-gold/20 text-brand-gold animate-pulse",
    revealing: "bg-brand-gold/20 text-brand-gold animate-pulse",
    completed: "bg-brand-green/30 text-brand-green",
  };
  const labels = {
    idle: "Waiting",
    locked: "Locked",
    spinning: "Spinning",
    revealing: "Revealing Winners",
    completed: "Completed",
  };

  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
