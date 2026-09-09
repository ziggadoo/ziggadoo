/** Picks an original ziggadoo illustration for a venue based on its categories. Used until real, licensed photos exist. */
const RULES: [string[], string][] = [
  [["splash-pad", "water-play"], "water-play"],
  [["beach"], "beach"],
  [["resort"], "resort"],
  [["butterflies"], "butterflies"],
  [["zoo", "animals", "horse-riding"], "animals"],
  [["theme-park", "rides"], "theme-park"],
  [["arcade"], "arcade"],
  [["trampoline", "inflatables", "ninja"], "trampoline"],
  [["climbing", "adventure"], "climbing"],
  [["lego", "creative", "bricks"], "bricks"],
  [["role-play"], "role-play"],
  [["party"], "party"],
  [["stem", "robotics", "edutainment", "play-museum", "arts"], "edutainment"],
  [["market"], "market"],
  [["cycling"], "cycling"],
  [["playground", "park"], "playground"],
  [["nature", "rainforest", "gentle"], "nature"],
  [["soft-play", "toddlers", "indoor-play"], "soft-play"],
];

export function illustrationFor(categories: string[] | null | undefined, heroImageUrl?: string | null): string {
  if (heroImageUrl) return heroImageUrl;
  const cats = categories ?? [];
  for (const [keys, file] of RULES) if (keys.some((k) => cats.includes(k))) return `/illustrations/${file}.jpg`;
  return "/illustrations/soft-play.jpg";
}
