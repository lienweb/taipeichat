import { AVATAR_COLORS } from "@/constant";

// Pick a deterministic avatar color based on a string seed so colors stay stable without storage.
export const getAvatarColor = (identifier?: string): string => {
  const seed = identifier?.trim() || "default";
  let hash = 0;

  for (const char of seed) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0; // force 32-bit
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};
