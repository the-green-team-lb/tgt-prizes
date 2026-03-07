/**
 * Local in-memory store that replaces Convex for fully local operation.
 * Uses React state + event emitter pattern for real-time updates.
 */

export interface NumberEntry {
  number: number;
  color: string;
}

export interface Winner {
  number: number;
  color: string;
  prize: string;
  revealedAt: number;
}

export interface LiveDrawState {
  _id: string;
  title: string;
  participatingNumbers: NumberEntry[];
  serialNumbers?: string;
  prizes: string[];
  winnersCount: number;
  drawStatus: "idle" | "locked" | "spinning" | "revealing" | "completed";
  winners: Winner[];
  serverSeed: string;
  publicHash: string;
  muxStreamId?: string;
  muxPlaybackId?: string;
  muxStreamKey?: string;
  scheduledAt?: number;
  createdAt: number;
  raffleLink?: string;
  ticketImageId?: string;
  youtubeUrl?: string;
}

export interface DrawHistoryEntry {
  _id: string;
  title: string;
  participatingNumbers: NumberEntry[];
  serialNumbers?: string;
  prizes: string[];
  winnersCount: number;
  winners: Winner[];
  serverSeed: string;
  publicHash: string;
  muxAssetPlaybackId?: string;
  muxStreamId?: string;
  scheduledAt?: number;
  completedAt: number;
  raffleLink?: string;
  ticketImageId?: string;
  youtubeUrl?: string;
}

type Listener = () => void;

class LocalStore {
  private activeDraw: LiveDrawState | null = null;
  private drawHistory: DrawHistoryEntry[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tgt-prizes-state");
        if (saved) {
          const parsed = JSON.parse(saved);
          this.activeDraw = parsed.activeDraw || null;
          this.drawHistory = parsed.drawHistory || [];
        }
      } catch {}
    }
  }

  private save() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "tgt-prizes-state",
          JSON.stringify({
            activeDraw: this.activeDraw,
            drawHistory: this.drawHistory,
          })
        );
      } catch {}
    }
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Queries
  getActiveDraw(isAdmin = false): LiveDrawState | null {
    if (!this.activeDraw) return null;
    if (isAdmin) return this.activeDraw;
    // Hide seed until completed
    if (this.activeDraw.drawStatus !== "completed") {
      return {
        ...this.activeDraw,
        serverSeed: "HIDDEN_UNTIL_COMPLETED",
        muxStreamKey: undefined,
      };
    }
    return { ...this.activeDraw, muxStreamKey: undefined };
  }

  getDrawHistory(): DrawHistoryEntry[] {
    return [...this.drawHistory].sort((a, b) => b.completedAt - a.completedAt);
  }

  getDrawById(id: string): DrawHistoryEntry | null {
    return this.drawHistory.find((d) => d._id === id) || null;
  }

  // Mutations
  async createDraw(title: string, prizes: string[], winnersCount: number): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const serverSeed = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const id = "draw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    this.activeDraw = {
      _id: id,
      title,
      participatingNumbers: [],
      prizes,
      winnersCount,
      drawStatus: "idle",
      winners: [],
      serverSeed,
      publicHash: "",
      createdAt: Date.now(),
    };
    this.save();
    return id;
  }

  async loadNumbers(numbers: NumberEntry[]): Promise<{ drawId: string; serverSeed: string }> {
    if (!this.activeDraw) throw new Error("No active draw");
    if (this.activeDraw.drawStatus !== "idle") throw new Error("Draw already started");

    this.activeDraw.participatingNumbers = numbers;
    this.save();
    return { drawId: this.activeDraw._id, serverSeed: this.activeDraw.serverSeed };
  }

  async computeAndStoreHash(serverSeed: string, numbers: NumberEntry[]): Promise<string> {
    const sorted = [...numbers].sort((a, b) => a.number - b.number);
    const serialized = sorted.map((n) => `${n.number}-${n.color}`).join("|");
    const data = serverSeed + ":" + serialized;

    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(buffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (this.activeDraw) {
      this.activeDraw.publicHash = hash;
      this.save();
    }
    return hash;
  }

  lockDraw() {
    if (!this.activeDraw) throw new Error("No active draw");
    if (this.activeDraw.participatingNumbers.length === 0) throw new Error("No numbers loaded");
    if (!this.activeDraw.publicHash) throw new Error("Hash not computed yet");
    this.activeDraw.drawStatus = "locked";
    this.save();
  }

  startDraw() {
    if (!this.activeDraw) throw new Error("No active draw");
    if (this.activeDraw.drawStatus !== "locked") throw new Error("Draw must be locked first");
    this.activeDraw.drawStatus = "spinning";
    this.save();
  }

  startRevealing() {
    if (!this.activeDraw) throw new Error("No active draw");
    if (this.activeDraw.drawStatus !== "spinning") throw new Error("Draw must be spinning");
    this.activeDraw.drawStatus = "revealing";
    this.save();
  }

  revealNextWinner(): { winner: Winner; isComplete: boolean } {
    if (!this.activeDraw) throw new Error("No active draw");
    if (this.activeDraw.drawStatus !== "revealing") throw new Error("Draw must be in revealing state");

    const currentCount = this.activeDraw.winners.length;
    if (currentCount >= this.activeDraw.winnersCount) throw new Error("All winners revealed");

    const wonNumbers = new Set(this.activeDraw.winners.map((w) => w.number));
    const available = this.activeDraw.participatingNumbers.filter((n) => !wonNumbers.has(n.number));
    if (available.length === 0) throw new Error("No more numbers available");

    const randomIndex = Math.floor(Math.random() * available.length);
    const picked = available[randomIndex];
    const prize = this.activeDraw.prizes[currentCount] || this.activeDraw.prizes[this.activeDraw.prizes.length - 1] || "Prize";

    const winner: Winner = {
      number: picked.number,
      color: picked.color,
      prize,
      revealedAt: Date.now(),
    };

    this.activeDraw.winners.push(winner);
    const isComplete = this.activeDraw.winners.length >= this.activeDraw.winnersCount;
    if (isComplete) {
      this.activeDraw.drawStatus = "completed";
    }
    this.save();
    return { winner, isComplete };
  }

  archiveDraw(): string {
    if (!this.activeDraw) throw new Error("No active draw");
    if (this.activeDraw.drawStatus !== "completed") throw new Error("Draw must be completed");

    const historyEntry: DrawHistoryEntry = {
      _id: "hist_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      title: this.activeDraw.title,
      participatingNumbers: this.activeDraw.participatingNumbers,
      serialNumbers: this.activeDraw.serialNumbers,
      prizes: this.activeDraw.prizes,
      winnersCount: this.activeDraw.winnersCount,
      winners: this.activeDraw.winners,
      serverSeed: this.activeDraw.serverSeed,
      publicHash: this.activeDraw.publicHash,
      muxStreamId: this.activeDraw.muxStreamId,
      completedAt: Date.now(),
      raffleLink: this.activeDraw.raffleLink,
      ticketImageId: this.activeDraw.ticketImageId,
      youtubeUrl: this.activeDraw.youtubeUrl,
    };

    this.drawHistory.push(historyEntry);
    this.activeDraw = null;
    this.save();
    return historyEntry._id;
  }

  resetDraw() {
    this.activeDraw = null;
    this.save();
  }

  setMuxStream(streamId: string, playbackId: string, streamKey: string) {
    if (!this.activeDraw) throw new Error("No active draw");
    this.activeDraw.muxStreamId = streamId;
    this.activeDraw.muxPlaybackId = playbackId;
    this.activeDraw.muxStreamKey = streamKey;
    this.save();
  }

  setYoutubeUrl(url: string) {
    if (!this.activeDraw) throw new Error("No active draw");
    this.activeDraw.youtubeUrl = url;
    this.save();
  }
}

// Singleton
let storeInstance: LocalStore | null = null;

export function getStore(): LocalStore {
  if (!storeInstance) {
    storeInstance = new LocalStore();
  }
  return storeInstance;
}
