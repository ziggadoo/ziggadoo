/** Picks an original ziggadoo illustration for a venue based on its categories. Used until real, licensed photos exist. */
const RULES: [string[], string][] = [
  [["water-play", "splash-pad"], "water-play"],
  [["zoo", "animals", "rainforest"], "animals"],
  [["theme-park", "rides", "arcade"], "theme-park"],
  [["climbing", "ninja", "inflatables", "trampoline", "adventure"], "climbing"],
  [["lego", "creative"], "bricks"],
  [["stem", "robotics", "edutainment", "role-play", "play-museum"], "edutainment"],
  [["market"], "market"],
  [["cycling", "park"], "cycling"],
  [["nature", "gentle"], "nature"],
  [["soft-play", "toddlers", "indoor-play"], "soft-play"],
];

export function illustrationFor(categories: string[] | null | undefined, heroImageUrl?: string | null): string {
  if (heroImageUrl) return heroImageUrl;
  const cats = categories ?? [];
  for (const [keys, file] of RULES) if (keys.some((k) => cats.includes(k))) return `/illustrations/${file}.svg`;
  return "/illustrations/default.svg";
}
