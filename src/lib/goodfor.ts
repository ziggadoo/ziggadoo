/** "Good for" tags. Stored in venues.categories alongside activity categories; picked by admins, claimed venues answer them in the venue form. */
export const GOOD_FOR = [
  { key: "homeschool", label: "Homeschoolers", note: "Places with weekday daytime sessions, quieter and happy to host learning groups." },
  { key: "sunflower", label: "Sunflower friendly", note: "Places that recognise the Hidden Disabilities Sunflower lanyard and have told us their staff are trained to support children with hidden disabilities." },
  { key: "coffee-watch", label: "Coffee and watch", note: "Places with a café where you can sit with a coffee and still see the play area." },
  { key: "toddler-sessions", label: "Toddler-only sessions", note: "Places that run sessions reserved for under-3s, away from the big kids." },
  { key: "rainy-day", label: "Rainy-day picks", note: "Fully indoor places that work when the weather doesn't." },
  { key: "party-venue", label: "Party venues", note: "Places that host birthday parties and have shared their packages with us." },
  { key: "hidden-gem", label: "Hidden gems", note: "Our own picks: less known places we think deserve more love." },
] as const;

export type GoodForKey = (typeof GOOD_FOR)[number]["key"];
export const GOOD_FOR_KEYS = GOOD_FOR.map((g) => g.key) as string[];
export function goodFor(key: string | undefined) { return GOOD_FOR.find((g) => g.key === key) ?? null; }

export const SORTS = [
  { key: "best", label: "Best match" },
  { key: "distance", label: "Distance" },
  { key: "price", label: "Price low to high" },
  { key: "name", label: "A to Z" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

/** Facility flags a venue can have. Stored as booleans in venues.facilities. */
export const FACILITIES = [
  { key: "cafe_view", label: "Café with a view of the play area" },
  { key: "food_allowed", label: "Own food and drink allowed in" },
  { key: "prams", label: "Prams welcome inside" },
  { key: "nursing_room", label: "Nursing / feeding room" },
  { key: "nappy_change", label: "Nappy changing" },
  { key: "parking_free", label: "Free parking" },
  { key: "wheelchair", label: "Wheelchair accessible" },
  { key: "party_room", label: "Private party room" },
  { key: "drop_off", label: "Drop-off allowed (parents can leave)" },
  { key: "socks_required", label: "Socks required" },
] as const;
