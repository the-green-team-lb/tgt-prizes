"use client";

interface MuxPlayerProps {
  playbackId: string;
  isLive: boolean;
}

export default function MuxPlayer({ playbackId, isLive }: MuxPlayerProps) {
  // Use the Mux player web component directly via iframe for maximum compatibility
  const src = `https://stream.mux.com/${playbackId}.m3u8`;

  return (
    <div className="relative w-full aspect-video bg-black">
      {isLive && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-red-600/90 text-white text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      )}
      {/* @ts-expect-error - mux-player is a web component */}
      <mux-player
        stream-type={isLive ? "live" : "on-demand"}
        playback-id={playbackId}
        metadata-video-title="The Green Team Prizes Draw"
        accent-color="#FFD700"
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <script
        src="https://cdn.jsdelivr.net/npm/@mux/mux-player@latest"
        defer
      />
    </div>
  );
}
