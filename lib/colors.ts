export interface ColorConfig {
  name: string;
  bg: string;
  text: string;
  gradient: string;
  hex: string;
  border: string;
}

export const COLORS: Record<string, ColorConfig> = {
  Red: {
    name: "Red",
    bg: "bg-red-600",
    text: "text-red-400",
    gradient: "from-red-600 to-red-800",
    hex: "#dc2626",
    border: "border-red-500",
  },
  Blue: {
    name: "Blue",
    bg: "bg-blue-600",
    text: "text-blue-400",
    gradient: "from-blue-600 to-blue-800",
    hex: "#2563eb",
    border: "border-blue-500",
  },
  Green: {
    name: "Green",
    bg: "bg-green-600",
    text: "text-green-400",
    gradient: "from-green-600 to-green-800",
    hex: "#16a34a",
    border: "border-green-500",
  },
  Orange: {
    name: "Orange",
    bg: "bg-orange-500",
    text: "text-orange-400",
    gradient: "from-orange-500 to-orange-700",
    hex: "#f97316",
    border: "border-orange-500",
  },
  Purple: {
    name: "Purple",
    bg: "bg-purple-600",
    text: "text-purple-400",
    gradient: "from-purple-600 to-purple-800",
    hex: "#9333ea",
    border: "border-purple-500",
  },
  Yellow: {
    name: "Yellow",
    bg: "bg-yellow-500",
    text: "text-yellow-400",
    gradient: "from-yellow-500 to-yellow-600",
    hex: "#eab308",
    border: "border-yellow-500",
  },
  Pink: {
    name: "Pink",
    bg: "bg-pink-500",
    text: "text-pink-400",
    gradient: "from-pink-500 to-pink-700",
    hex: "#ec4899",
    border: "border-pink-500",
  },
};

export const COLOR_NAMES = Object.keys(COLORS);

// Generate a consistent color from any name
function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 50%)`;
}

export function getColor(name: string): ColorConfig {
  if (COLORS[name]) return COLORS[name];
  // Generate a consistent color for any custom name
  const hex = hashColor(name);
  return {
    name,
    bg: "bg-gray-500",
    text: "text-gray-400",
    gradient: "from-gray-500 to-gray-700",
    hex,
    border: "border-gray-500",
  };
}
