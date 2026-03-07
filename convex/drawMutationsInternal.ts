import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Internal mutation to set the public hash on a draw.
 * Only callable from server actions, not from clients.
 */
export const setPublicHash = internalMutation({
  args: {
    drawId: v.id("liveDrawState"),
    publicHash: v.string(),
  },
  handler: async (ctx, args) => {
    const draw = await ctx.db.get(args.drawId);
    await ctx.db.patch(args.drawId, {
      publicHash: args.publicHash,
    });

    // If draw has a scheduled time, schedule auto-start
    if (draw && draw.scheduledAt) {
      const msUntilStart = draw.scheduledAt - Date.now();
      if (msUntilStart > 0) {
        await ctx.scheduler.runAfter(msUntilStart, internal.drawMutations.scheduledAutoStart);
      } else {
        // Scheduled time already passed — start immediately
        await ctx.scheduler.runAfter(1000, internal.drawMutations.scheduledAutoStart);
      }
    }
  },
});

/**
 * Internal mutation to update Mux asset playback ID on draw history.
 */
export const setMuxAssetPlaybackId = internalMutation({
  args: {
    drawHistoryId: v.id("drawHistory"),
    muxAssetPlaybackId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.drawHistoryId, {
      muxAssetPlaybackId: args.muxAssetPlaybackId,
    });
  },
});
