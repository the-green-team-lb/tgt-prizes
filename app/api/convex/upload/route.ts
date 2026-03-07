import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let processedBytes: Uint8Array = new Uint8Array(bytes);
    let mimeType = file.type || "image/png";

    // Try to process with sharp (white background), fall back to original on failure
    try {
      const sharp = (await import("sharp")).default;
      const result = await sharp(Buffer.from(bytes))
        .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();
      processedBytes = new Uint8Array(result);
      mimeType = "image/png";
    } catch {
      console.log("Sharp processing skipped, using original image");
    }

    // Convert to base64 for Convex action
    const base64 = `data:${mimeType};base64,${Buffer.from(processedBytes).toString("base64")}`;

    // Upload using Convex action
    const storageId = await convex.action(api.drawActions.uploadImage, {
      base64Data: base64,
      filename: file.name,
    });

    if (!storageId) {
      return NextResponse.json(
        { error: "Failed to upload to Convex storage" },
        { status: 500 }
      );
    }

    // Get the URL for the uploaded file
    const url = await convex.action(api.drawActions.getImageUrl, {
      storageId,
    });

    return NextResponse.json({ storageId, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
