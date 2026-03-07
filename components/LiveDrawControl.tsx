"use client";

import { useDrawMutations } from "@/lib/use-local-store";
import { useState, useEffect, useRef } from "react";

interface DrawState {
  drawStatus: "idle" | "locked" | "spinning" | "revealing" | "completed";
  winnersCount: number;
  winners: { number: number; color: string; prize: string; revealedAt: number }[];
  participatingNumbers: { number: number; color: string }[];
  publicHash: string;
  scheduledAt?: number;
}

interface LiveDrawControlProps {
  draw: DrawState;
}

export default function LiveDrawControl({ draw }: LiveDrawControlProps) {
  const {
    lockDraw,
    startDraw,
    startRevealing,
    revealNextWinner,
    archiveDraw,
    resetDraw,
  } = useDrawMutations();
  const [loading, setLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(false);

  // Auto-resume if draw is already in progress on page load
  useEffect(() => {
    if (
      (draw.drawStatus === "revealing" || draw.drawStatus === "spinning") &&
      !autoRunning
    ) {
      setAutoRunning(true);
      autoRef.current = true;
    }
  }, []); // only on mount

  // Auto-start when scheduled time arrives
  useEffect(() => {
    if (
      draw.drawStatus !== "idle" ||
      !draw.scheduledAt ||
      draw.participatingNumbers.length === 0 ||
      !draw.publicHash
    )
      return;

    const msUntilStart = draw.scheduledAt - Date.now();
    if (msUntilStart <= 0) {
      // Time already passed — start immediately
      (async () => {
        setLoading(true);
        setAutoRunning(true);
        autoRef.current = true;
        try {
          await lockDraw();
          await startDraw();
        } catch (err) {
          console.error("Auto-start failed:", err);
          setAutoRunning(false);
          autoRef.current = false;
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    // Schedule for the future
    const timer = setTimeout(async () => {
      setLoading(true);
      setAutoRunning(true);
      autoRef.current = true;
      try {
        await lockDraw();
        await startDraw();
      } catch (err) {
        console.error("Scheduled auto-start failed:", err);
        setAutoRunning(false);
        autoRef.current = false;
      } finally {
        setLoading(false);
      }
    }, msUntilStart);

    return () => clearTimeout(timer);
  }, [draw.drawStatus, draw.scheduledAt, draw.participatingNumbers.length, draw.publicHash]);

  // One-click full draw
  // Lock → spin → auto-reveal all → auto-archive
  const handleStartDraw = async () => {
    setLoading(true);
    setAutoRunning(true);
    autoRef.current = true;
    try {
      // Lock first, then start spinning
      await lockDraw();
      await startDraw();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to start draw");
      setAutoRunning(false);
      autoRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Auto: after spinning, wait 12s then start revealing
  useEffect(() => {
    if (draw.drawStatus === "spinning" && autoRunning) {
      const timer = setTimeout(async () => {
        if (!autoRef.current) return;
        try {
          await startRevealing();
        } catch (err) {
          console.error("Auto-reveal start failed:", err);
        }
      }, 5000); // 5s initial spin
      return () => clearTimeout(timer);
    }
  }, [draw.drawStatus, autoRunning]);

  // Auto: reveal winners one by one, then archive
  useEffect(() => {
    if (draw.drawStatus === "revealing" && autoRunning) {
      const allRevealed = draw.winners.length >= draw.winnersCount;
      if (allRevealed) {
        // All done — will auto-archive when status changes to completed
        setAutoRunning(false);
        autoRef.current = false;
        return;
      }

      const timer = setTimeout(async () => {
        if (!autoRef.current) return;
        try {
          await revealNextWinner();
        } catch (err) {
          console.error("Auto-reveal failed:", err);
          setAutoRunning(false);
          autoRef.current = false;
        }
      }, 5000); // 3s spin + 2s display per winner
      return () => clearTimeout(timer);
    }
  }, [draw.drawStatus, draw.winners.length, autoRunning]);

  // Auto-archive when draw completes
  useEffect(() => {
    if (draw.drawStatus === "completed") {
      // Short delay so viewers see the final state, then archive
      const timer = setTimeout(async () => {
        try {
          await archiveDraw();
        } catch (err) {
          console.error("Auto-archive failed:", err);
        }
      }, 60000); // 60s to see "completed" state, then auto-saves
      return () => clearTimeout(timer);
    }
  }, [draw.drawStatus]);

  const readyToStart =
    draw.drawStatus === "idle" &&
    draw.participatingNumbers.length > 0 &&
    !!draw.publicHash;

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-medium text-brand-muted mb-4">
        Draw Controls
      </h3>

      <div className="space-y-3">
        {/* Idle: show Start Draw button */}
        {draw.drawStatus === "idle" && (
          <>
            <p className="text-sm text-brand-muted mb-3">
              {draw.participatingNumbers.length === 0
                ? "Load numbers first, then start the draw."
                : !draw.publicHash
                  ? "Computing hash..."
                  : `${draw.participatingNumbers.length} numbers loaded. Ready to draw!`}
            </p>
            <button
              onClick={handleStartDraw}
              disabled={loading || !readyToStart}
              className="w-full bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Draw"}
            </button>
            {readyToStart && (
              <p className="text-xs text-brand-muted text-center">
                Reveals {draw.winnersCount} winners, then auto-saves to Past Draws
              </p>
            )}
          </>
        )}

        {/* Spinning */}
        {draw.drawStatus === "spinning" && (
          <div className="text-center py-3">
            <p className="text-brand-gold font-medium text-sm animate-pulse">
              Wheel spinning... winners reveal automatically
            </p>
          </div>
        )}

        {/* Revealing */}
        {draw.drawStatus === "revealing" && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-brand-muted">
                Winners: {draw.winners.length} / {draw.winnersCount}
              </p>
              <span className="text-sm text-brand-gold animate-pulse">Revealing...</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-brand-card overflow-hidden border border-brand-border">
              <div
                className="h-full bg-gradient-to-r from-brand-gold to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(draw.winners.length / draw.winnersCount) * 100}%` }}
              />
            </div>
          </>
        )}

        {/* Completed — auto-archiving */}
        {draw.drawStatus === "completed" && (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <p className="text-green-400 font-semibold text-sm">
              Draw Complete! All {draw.winnersCount} winners revealed.
            </p>
            <p className="text-xs text-brand-muted mt-2 animate-pulse">
              Auto-saving to Past Draws in 1 minute...
            </p>
          </div>
        )}

        {/* Reset always available */}
        <button
          onClick={() => {
            if (
              confirm(
                "Are you sure? This will delete the active draw without saving."
              )
            ) {
              setAutoRunning(false);
              autoRef.current = false;
              resetDraw();
            }
          }}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors text-sm"
        >
          Reset / Delete Draw
        </button>
      </div>
    </div>
  );
}
