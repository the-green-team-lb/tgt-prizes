import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Create a new draw (replaces any existing active draw).
 */
export const createDraw = mutation({
  args: {
    title: v.string(),
    prizes: v.array(v.string()),
    winnersCount: v.number(),
    scheduledAt: v.optional(v.number()),
    raffleLink: v.optional(v.string()),
    ticketImageUrl: v.optional(v.string()),
    drawNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Delete any existing active draw
    const existing = await ctx.db.query("liveDrawState").collect();
    for (const draw of existing) {
      await ctx.db.delete(draw._id);
    }

    // Generate server seed
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const serverSeed = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const id = await ctx.db.insert("liveDrawState", {
      title: args.title,
      participatingNumbers: [],
      prizes: args.prizes,
      winnersCount: args.winnersCount,
      drawStatus: "idle",
      winners: [],
      serverSeed,
      publicHash: "",
      ...(args.scheduledAt !== undefined ? { scheduledAt: args.scheduledAt } : {}),
      ...(args.raffleLink ? { raffleLink: args.raffleLink } : {}),
      ...(args.ticketImageUrl ? { ticketImageUrl: args.ticketImageUrl } : {}),
      ...(args.drawNote ? { drawNote: args.drawNote } : {}),
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Load numbers into the active draw and trigger hash computation.
 */
export const loadNumbers = mutation({
  args: {
    numbers: v.array(
      v.object({
        number: v.number(),
        color: v.string(),
      })
    ),
    serialNumbers: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");
    if (draw.drawStatus !== "idle")
      throw new Error("Draw already started");

    await ctx.db.patch(draw._id, {
      participatingNumbers: args.numbers,
      ...(args.serialNumbers ? { serialNumbers: args.serialNumbers } : {}),
    });

    // Return draw ID and seed so the client can call computeAndStoreHash action
    return {
      drawId: draw._id,
      serverSeed: draw.serverSeed,
    };
  },
});

/**
 * Lock the draw - no more changes to numbers, hash is final.
 */
export const lockDraw = mutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");
    if (draw.participatingNumbers.length === 0)
      throw new Error("No numbers loaded");
    if (!draw.publicHash) throw new Error("Hash not computed yet");

    await ctx.db.patch(draw._id, {
      drawStatus: "locked",
    });
  },
});

/**
 * Start the draw (wheel spin animation).
 */
export const startDraw = mutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");
    if (draw.drawStatus !== "locked")
      throw new Error("Draw must be locked first");

    await ctx.db.patch(draw._id, {
      drawStatus: "spinning",
    });
  },
});

/**
 * Transition from spinning to revealing.
 */
export const startRevealing = mutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");
    if (draw.drawStatus !== "spinning")
      throw new Error("Draw must be spinning");

    await ctx.db.patch(draw._id, {
      drawStatus: "revealing",
    });
  },
});

/**
 * Reveal the next winner. Picks randomly from remaining numbers.
 */
export const revealNextWinner = mutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");
    if (draw.drawStatus !== "revealing")
      throw new Error("Draw must be in revealing state");

    const currentWinnerCount = draw.winners.length;
    if (currentWinnerCount >= draw.winnersCount) {
      throw new Error("All winners have been revealed");
    }

    // Get numbers that haven't won yet
    const wonNumbers = new Set(draw.winners.map((w) => w.number));
    const available = draw.participatingNumbers.filter(
      (n) => !wonNumbers.has(n.number)
    );

    if (available.length === 0) {
      throw new Error("No more numbers available");
    }

    // Pick a random winner
    const randomIndex = Math.floor(Math.random() * available.length);
    const winner = available[randomIndex];

    const prize =
      draw.prizes[currentWinnerCount] ||
      draw.prizes[draw.prizes.length - 1] ||
      "Prize";

    const newWinners = [
      ...draw.winners,
      {
        number: winner.number,
        color: winner.color,
        prize,
        revealedAt: Date.now(),
      },
    ];

    const isComplete = newWinners.length >= draw.winnersCount;

    await ctx.db.patch(draw._id, {
      winners: newWinners,
      drawStatus: isComplete ? "completed" : "revealing",
    });

    return {
      winner: {
        number: winner.number,
        color: winner.color,
        prize,
      },
      isComplete,
    };
  },
});

/**
 * Archive the current draw and reset.
 */
export const archiveDraw = mutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");
    if (draw.drawStatus !== "completed")
      throw new Error("Draw must be completed to archive");

    // Save to history
    const historyId = await ctx.db.insert("drawHistory", {
      title: draw.title,
      participatingNumbers: draw.participatingNumbers,
      serialNumbers: draw.serialNumbers,
      prizes: draw.prizes,
      winnersCount: draw.winnersCount,
      winners: draw.winners,
      serverSeed: draw.serverSeed,
      publicHash: draw.publicHash,
      muxStreamId: draw.muxStreamId,
      youtubeUrl: draw.youtubeUrl,
      ...(draw.scheduledAt !== undefined ? { scheduledAt: draw.scheduledAt } : {}),
      ...(draw.raffleLink ? { raffleLink: draw.raffleLink } : {}),
      ...(draw.ticketImageUrl ? { ticketImageUrl: draw.ticketImageUrl } : {}),
      ...(draw.drawNote ? { drawNote: draw.drawNote } : {}),
      ...(draw.viewCount ? { viewCount: draw.viewCount } : {}),
      completedAt: Date.now(),
    });

    // Delete active draw
    await ctx.db.delete(draw._id);

    return historyId;
  },
});

/**
 * Reset the active draw completely (delete without archiving).
 */
export const resetDraw = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("liveDrawState").collect();
    for (const draw of existing) {
      await ctx.db.delete(draw._id);
    }
  },
});

/**
 * Set Mux stream details on the active draw.
 */
export const setMuxStream = mutation({
  args: {
    muxStreamId: v.string(),
    muxPlaybackId: v.string(),
    muxStreamKey: v.string(),
  },
  handler: async (ctx, args) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");

    await ctx.db.patch(draw._id, {
      muxStreamId: args.muxStreamId,
      muxPlaybackId: args.muxPlaybackId,
      muxStreamKey: args.muxStreamKey,
    });
  },
});

/**
 * Set YouTube URL on the active draw.
 */
export const setYoutubeUrl = mutation({
  args: {
    youtubeUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) throw new Error("No active draw");

    await ctx.db.patch(draw._id, {
      youtubeUrl: args.youtubeUrl,
    });
  },
});

// ── Scheduled auto-run mutations ─────────────────────────────

/**
 * Auto-start: lock the draw and begin spinning, then schedule reveal.
 */
export const scheduledAutoStart = internalMutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) return; // draw was deleted
    if (draw.drawStatus !== "idle") return; // already started manually
    if (draw.participatingNumbers.length === 0) return;
    if (!draw.publicHash) return;

    // Lock and start spinning
    await ctx.db.patch(draw._id, { drawStatus: "locked" });
    await ctx.db.patch(draw._id, { drawStatus: "spinning" });

    // Schedule first reveal after 5s spin
    await ctx.scheduler.runAfter(5000, internal.drawMutations.scheduledStartRevealing);
  },
});

/**
 * Transition from spinning to revealing, then reveal first winner.
 */
export const scheduledStartRevealing = internalMutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw || draw.drawStatus !== "spinning") return;

    await ctx.db.patch(draw._id, { drawStatus: "revealing" });

    // Schedule first winner reveal
    await ctx.scheduler.runAfter(3000, internal.drawMutations.scheduledRevealNext);
  },
});

/**
 * Reveal the next winner, then schedule the next one or archive.
 */
export const scheduledRevealNext = internalMutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) return;
    if (draw.drawStatus !== "revealing") return;

    const currentWinnerCount = draw.winners.length;
    if (currentWinnerCount >= draw.winnersCount) return;

    // Pick random winner from remaining numbers
    const wonNumbers = new Set(draw.winners.map((w) => w.number));
    const available = draw.participatingNumbers.filter(
      (n) => !wonNumbers.has(n.number)
    );
    if (available.length === 0) return;

    const randomIndex = Math.floor(Math.random() * available.length);
    const winner = available[randomIndex];
    const prize =
      draw.prizes[currentWinnerCount] ||
      draw.prizes[draw.prizes.length - 1] ||
      "Prize";

    const newWinners = [
      ...draw.winners,
      {
        number: winner.number,
        color: winner.color,
        prize,
        revealedAt: Date.now(),
      },
    ];

    const isComplete = newWinners.length >= draw.winnersCount;

    await ctx.db.patch(draw._id, {
      winners: newWinners,
      drawStatus: isComplete ? "completed" : "revealing",
    });

    if (isComplete) {
      // Archive after 60 seconds so viewers can see the results
      await ctx.scheduler.runAfter(60000, internal.drawMutations.scheduledArchive);
    } else {
      // Reveal next winner after 5 seconds
      await ctx.scheduler.runAfter(5000, internal.drawMutations.scheduledRevealNext);
    }
  },
});

/**
 * Auto-archive the completed draw to history.
 */
export const scheduledArchive = internalMutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw || draw.drawStatus !== "completed") return;

    await ctx.db.insert("drawHistory", {
      title: draw.title,
      participatingNumbers: draw.participatingNumbers,
      serialNumbers: draw.serialNumbers,
      prizes: draw.prizes,
      winnersCount: draw.winnersCount,
      winners: draw.winners,
      serverSeed: draw.serverSeed,
      publicHash: draw.publicHash,
      muxStreamId: draw.muxStreamId,
      youtubeUrl: draw.youtubeUrl,
      ...(draw.scheduledAt !== undefined ? { scheduledAt: draw.scheduledAt } : {}),
      ...(draw.raffleLink ? { raffleLink: draw.raffleLink } : {}),
      ...(draw.ticketImageUrl ? { ticketImageUrl: draw.ticketImageUrl } : {}),
      ...(draw.drawNote ? { drawNote: draw.drawNote } : {}),
      ...(draw.viewCount ? { viewCount: draw.viewCount } : {}),
      completedAt: Date.now(),
    });

    await ctx.db.delete(draw._id);
  },
});

/**
 * Delete a draw from history (admin only).
 */
export const deleteDrawFromHistory = mutation({
  args: {
    drawId: v.id("drawHistory"),
  },
  handler: async (ctx, args) => {
    const draw = await ctx.db.get(args.drawId);
    if (!draw) throw new Error("Draw not found");

    await ctx.db.delete(args.drawId);
  },
});

/**
 * Increment view count for active draw.
 */
export const incrementViewCount = mutation({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) return;
    await ctx.db.patch(draw._id, {
      viewCount: (draw.viewCount || 0) + 1,
    });
  },
});

/**
 * Increment view count for a past draw.
 */
export const incrementDrawHistoryViewCount = mutation({
  args: {
    drawId: v.id("drawHistory"),
  },
  handler: async (ctx, args) => {
    const draw = await ctx.db.get(args.drawId);
    if (!draw) return;
    await ctx.db.patch(args.drawId, {
      viewCount: (draw.viewCount || 0) + 1,
    });
  },
});
