"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { NumberEntry, Winner, LiveDrawState, DrawHistoryEntry } from "./local-store";

// Re-export types so existing component imports keep working
export type { NumberEntry, Winner, LiveDrawState, DrawHistoryEntry };

/**
 * Get the active draw. Pass isAdmin=true for full state (including server seed).
 * Returns null when no draw exists or still loading.
 */
export function useActiveDraw(isAdmin = false) {
  const publicDraw = useQuery(
    api.drawQueries.getActiveDraw,
    isAdmin ? "skip" : {}
  );
  const adminDraw = useQuery(
    api.drawQueries.getActiveDrawAdmin,
    isAdmin ? {} : "skip"
  );
  const result = isAdmin ? adminDraw : publicDraw;
  return result ?? null;
}

/**
 * Get all completed draws for the archive page.
 * Returns empty array while loading.
 */
export function useDrawHistory(): DrawHistoryEntry[] {
  return (useQuery(api.drawQueries.getDrawHistory) as DrawHistoryEntry[] | undefined) ?? [];
}

/**
 * Get a specific completed draw by ID.
 * Returns undefined while loading, null if not found.
 */
export function useDrawById(id: string): DrawHistoryEntry | null | undefined {
  return useQuery(api.drawQueries.getDrawById, { id: id as any }) as
    | DrawHistoryEntry
    | null
    | undefined;
}

/**
 * Returns mutation/action functions that match the existing call signatures.
 * Components call these exactly as before — the Convex backend handles everything.
 */
export function useDrawMutations() {
  const createDraw = useMutation(api.drawMutations.createDraw);
  const loadNumbers = useMutation(api.drawMutations.loadNumbers);
  const computeAndStoreHash = useAction(api.drawActions.computeAndStoreHash);
  const lockDraw = useMutation(api.drawMutations.lockDraw);
  const startDraw = useMutation(api.drawMutations.startDraw);
  const startRevealing = useMutation(api.drawMutations.startRevealing);
  const revealNextWinner = useMutation(api.drawMutations.revealNextWinner);
  const archiveDraw = useMutation(api.drawMutations.archiveDraw);
  const resetDraw = useMutation(api.drawMutations.resetDraw);
  const setMuxStream = useMutation(api.drawMutations.setMuxStream);
  const setYoutubeUrl = useMutation(api.drawMutations.setYoutubeUrl);
  const deleteDrawFromHistory = useMutation(api.drawMutations.deleteDrawFromHistory);

  return {
    createDraw,
    loadNumbers,
    computeAndStoreHash,
    lockDraw,
    startDraw,
    startRevealing,
    revealNextWinner,
    archiveDraw,
    resetDraw,
    setMuxStream,
    setYoutubeUrl,
    deleteDrawFromHistory,
  };
}
