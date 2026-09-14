/** "Good for" pills shown above the listings. Stored in venues.categories alongside activity categories; picked by admins, claimed venues answer them in the venue form.
 *  `free` is virtual: it is computed from the venue's price (free or up to 10 AED per child), never stored. */
export const GOOD_FOR = [
  { key: "homeschool", label: "Homeschoolers", note: "Venues and activities that we think are great for homeschoolers, including tours and field trips you can book as a family or a small group.", more: false },
  { key: "coffee-watch", label: "Coffee & Watch", note: "Activities where you can sip your coffee and watch the kids play.", more: false },
  { key: "free", label: "Free & nearly free", note: "Free, or up to 10 AED per child: parks, beaches, markets and more.", more: false },
  { key: "sunflower", label: "Sunflower friendly", note: "Venues that parents report as Sunflower friendly (venues good for hidden disabilities).", more: false },
  { key: "party-venue", label: "Party venues", note: "Are you looking for a place to host a birthday party? Take your pick!", more: false },
  { key: "rainy-day", label: "Great for hot days", note: "Fully indoor, air-conditioned places for when it's too hot to be outside.", more: true },
  { key: "toddler-sessions", label: "Toddler-only sessions", note: "Places that run sessions reserved for under-3s, away from the big kids.", more: true },
  { key: "hidden-gem", label: "Hidden gems", note: "Our own picks: less known places we think deserve more love.", more: true },
] as const;

export type GoodForKey = (typeof GOOD_FOR)[number]["key"];
/** Keys that are stored on venues (everything except the computed `free`). */
export const GOOD_FOR_KEYS = GOOD_FOR.map((g) => g.key as string).filter((k) => k !== "free");
export function goodFor(key: string | undefined) { return GOOD_FOR.find((g) => g.key === key) ?? null; }

/** Free or nearly free: no charge, or a child ticket of 10 AED or less. */
export const NEARLY_FREE_AED = 10;
export function isNearlyFree(v: { price_model: string; price_child_aed: number | string | null }): boolean {
  if (v.price_model === "free") return true;
  if (v.price_model === "unknown" || v.price_child_aed == null) return false;
  return Number(v.price_child_aed) <= NEARLY_FREE_AED;
}

export const SORTS = [
  { key: "best", label: "Best match" },
  { key: "distance", label: "Distance" },
  { key: "rated", label: "Best rated" },
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
