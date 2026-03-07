import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  liveDrawState: defineTable({
    title: v.string(),
    participatingNumbers: v.array(
      v.object({
        number: v.number(),
        color: v.string(),
      })
    ),
    serialNumbers: v.optional(v.string()),
    prizes: v.array(v.string()),
    winnersCount: v.number(),
    drawStatus: v.union(
      v.literal("idle"),
      v.literal("locked"),
      v.literal("spinning"),
      v.literal("revealing"),
      v.literal("completed")
    ),
    winners: v.array(
      v.object({
        number: v.number(),
        color: v.string(),
        prize: v.string(),
        revealedAt: v.number(),
      })
    ),
    serverSeed: v.string(),
    publicHash: v.string(),
    muxStreamId: v.optional(v.string()),
    muxPlaybackId: v.optional(v.string()),
    muxStreamKey: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    raffleLink: v.optional(v.string()),
    ticketImageUrl: v.optional(v.string()),
    drawNote: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
  }),

  drawHistory: defineTable({
    title: v.string(),
    participatingNumbers: v.array(
      v.object({
        number: v.number(),
        color: v.string(),
      })
    ),
    serialNumbers: v.optional(v.string()),
    prizes: v.array(v.string()),
    winnersCount: v.number(),
    winners: v.array(
      v.object({
        number: v.number(),
        color: v.string(),
        prize: v.string(),
        revealedAt: v.number(),
      })
    ),
    serverSeed: v.string(),
    publicHash: v.string(),
    muxAssetPlaybackId: v.optional(v.string()),
    muxStreamId: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    raffleLink: v.optional(v.string()),
    ticketImageUrl: v.optional(v.string()),
    drawNote: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    completedAt: v.number(),
  }),
});
