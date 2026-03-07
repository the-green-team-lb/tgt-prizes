import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Compute hash of server seed + numbers and store it.
 * Runs as an action since it needs Web Crypto API.
 */
export const computeAndStoreHash = action({
  args: {
    drawId: v.id("liveDrawState"),
    serverSeed: v.string(),
    numbers: v.array(
      v.object({
        number: v.number(),
        color: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Serialize numbers deterministically (sorted by number)
    const sorted = [...args.numbers].sort((a, b) => a.number - b.number);
    const serialized = sorted.map((n) => `${n.number}-${n.color}`).join("|");
    const data = args.serverSeed + ":" + serialized;

    // Compute SHA-256 hash
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(buffer));
    const hash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store hash via internal mutation
    await ctx.runMutation(internal.drawMutationsInternal.setPublicHash, {
      drawId: args.drawId,
      publicHash: hash,
    });

    return hash;
  },
});

/**
 * Upload an image to Convex storage.
 * Takes base64 image data and stores it, returns the storage ID.
 */
export const uploadImage = action({
  args: {
    base64Data: v.string(),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Extract mime type and data from base64 string
    const matches = args.base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid base64 image data");
    }

    const mimeType = matches[1];
    const base64 = matches[2];

    // Convert base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a Blob with the correct MIME type
    const blob = new Blob([bytes], { type: mimeType });

    // Store in Convex storage
    const storageId = await ctx.storage.store(blob as any);

    return storageId;
  },
});

/**
 * Get the URL for a stored image.
 */
export const getImageUrl = action({
  args: {
    storageId: v.any(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});
