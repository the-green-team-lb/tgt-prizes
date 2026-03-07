import { NumberEntry } from "./provably-fair";
import { COLOR_NAMES } from "./colors";

/**
 * Parse number input — flexible format.
 *
 * Supported formats (case-insensitive colors):
 *   1-800 Pink                         → 800 pink entries
 *   1-1000 Blue, 1-342 Yellow          → comma-separated on one line
 *   500 Pink                           → shorthand for 1-500 Pink
 *   1-100 Red, 200-300 Green           → multiple ranges
 *   1-800 pink                         → case insensitive
 *
 * Lines and comma-separated segments are all supported.
 */
export function parseNumberInput(input: string): NumberEntry[] {
  const entries: NumberEntry[] = [];

  // Split by newlines AND commas to get all segments
  const segments = input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const segment of segments) {
    // Try: "start-end color"
    const rangeMatch = segment.match(/^(\d+)\s*-\s*(\d+)\s+(\w+)$/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const color = matchColor(rangeMatch[3]);
      if (!color) continue;

      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      for (let i = lo; i <= hi; i++) {
        entries.push({ number: i, color });
      }
      continue;
    }

    // Try: "count color" (shorthand for 1-count)
    const countMatch = segment.match(/^(\d+)\s+(\w+)$/i);
    if (countMatch) {
      const count = parseInt(countMatch[1], 10);
      const color = matchColor(countMatch[2]);
      if (!color || count <= 0) continue;

      for (let i = 1; i <= count; i++) {
        entries.push({ number: i, color });
      }
      continue;
    }
  }

  return entries;
}

/**
 * Case-insensitive color matching.
 * Returns the properly-cased color name from known colors,
 * or accepts any custom color name with first letter capitalized.
 */
function matchColor(input: string): string | null {
  if (!input || !input.trim()) return null;
  const lower = input.toLowerCase();
  // Check known colors first
  const known = COLOR_NAMES.find((c) => c.toLowerCase() === lower);
  if (known) return known;
  // Accept any custom color - capitalize first letter
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

/**
 * Fisher-Yates shuffle - triple shuffle for extra randomness.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let pass = 0; pass < 3; pass++) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
}

/**
 * Select winners from the entries.
 * Shuffles entries and picks the first N.
 */
export function selectWinners(
  entries: NumberEntry[],
  count: number
): NumberEntry[] {
  const shuffled = shuffleArray(entries);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Format a number entry for display.
 */
export function formatEntry(entry: NumberEntry): string {
  return `#${entry.number} ${entry.color}`;
}
