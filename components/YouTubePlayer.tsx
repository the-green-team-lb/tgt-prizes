"use client";

interface YouTubePlayerProps {
  url: string;
}

/**
 * Builds the correct YouTube embed URL.
 * Supports:
 *  - Channel handle/ID → auto-shows the current live stream
 *  - Video/live URLs → embeds that specific video
 */
function getEmbedUrl(url: string): string | null {
  const trimmed = url.trim();

  // Channel handle: @THEGREENTEAMLB or youtube.com/@THEGREENTEAMLB
  const handleMatch = trimmed.match(
    /(?:youtube\.com\/@|^@)([a-zA-Z0-9_-]+)/
  );
  if (handleMatch) {
    // Use channel handle — doesn't need channel ID
    return null; // Can't embed by handle, need channel ID
  }

  // Channel ID: UCxxxxxxx or youtube.com/channel/UCxxxxxxx
  const channelMatch = trimmed.match(
    /(?:youtube\.com\/channel\/|^)(UC[a-zA-Z0-9_-]{22})$/
  );
  if (channelMatch) {
    return `https://www.youtube.com/embed/live_stream?channel=${channelMatch[1]}&autoplay=1`;
  }

  // Specific video/live URLs
  const videoPatterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of videoPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
  }

  // Bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}?autoplay=1&rel=0`;
  }

  return null;
}

// Hardcoded channel ID for auto-live embed
const CHANNEL_ID = "UCNw_4K8S7HZ_kNE1pqnLe8g";

export default function YouTubePlayer({ url }: YouTubePlayerProps) {
  // If a specific URL is given, use it; otherwise fall back to channel live stream
  const embedUrl =
    getEmbedUrl(url) ||
    `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1`;

  return (
    <div className="relative w-full aspect-video">
      <iframe
        className="absolute inset-0 w-full h-full rounded-xl"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
