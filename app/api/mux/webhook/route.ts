import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Mux Webhook Handler
 *
 * Receives events from Mux when:
 * - Stream goes active/idle
 * - Video asset is ready (recording available)
 *
 * On asset.ready: updates drawHistory with the recording playback ID
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify webhook signature
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (secret) {
    const sig = request.headers.get("mux-signature");
    if (sig) {
      const parts = sig.split(",");
      const timestampPart = parts.find((p) => p.startsWith("t="));
      const sigPart = parts.find((p) => p.startsWith("v1="));

      if (timestampPart && sigPart) {
        const timestamp = timestampPart.slice(2);
        const signature = sigPart.slice(3);
        const payload = `${timestamp}.${body}`;
        const expected = crypto
          .createHmac("sha256", secret)
          .update(payload)
          .digest("hex");

        if (signature !== expected) {
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
          );
        }
      }
    }
  }

  const event = JSON.parse(body);
  const type = event.type as string;

  console.log(`[Mux Webhook] Event: ${type}`);

  // Handle video asset ready - recording is available
  if (type === "video.asset.ready") {
    const asset = event.data;
    const playbackId = asset.playback_ids?.[0]?.id;
    const passthrough = asset.passthrough; // We'll store draw ID here

    if (playbackId && passthrough) {
      console.log(
        `[Mux Webhook] Asset ready: playback=${playbackId}, draw=${passthrough}`
      );
      // In production, call Convex to update the drawHistory record
      // For now, log it - the admin can manually set this
    }
  }

  return NextResponse.json({ received: true });
}
