import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the active draw state for public viewers.
 * IMPORTANT: Hides the server seed until draw is completed!
 */
export const getActiveDraw = query({
  args: {},
  handler: async (ctx) => {
    const draw = await ctx.db.query("liveDrawState").first();
    if (!draw) return null;

    // Hide server seed until draw is completed - this is critical for provable fairness
    if (draw.drawStatus !== "completed") {
      return {
        ...draw,
        serverSeed: "HIDDEN_UNTIL_COMPLETED",
        muxStreamKey: undefined,
      };
    }

    // After completion, reveal everything except stream key
    return {
      ...draw,
      muxStreamKey: undefined,
    };
  },
});

/**
 * Get the active draw state for admin (includes all fields).
 */
export const getActiveDrawAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("liveDrawState").first();
  },
});

/**
 * Get all completed draws for the archive page.
 */
export const getDrawHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("drawHistory")
      .order("desc")
      .collect();
  },
});

/**
 * Get a specific completed draw by ID.
 */
export const getDrawById = query({
  args: { id: v.id("drawHistory") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get the URL for a stored image.
 */
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
