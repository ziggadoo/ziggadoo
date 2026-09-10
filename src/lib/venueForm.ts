import { FACILITIES, GOOD_FOR } from "@/lib/goodfor";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "tel" | "email" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
  placeholder?: string;
  maxLength?: number;
};

export type Section = { title: string; intro?: string; fields: Field[] };

export const TAGLINE_MAX = 60;
export const DESCRIPTION_MAX = 320;

const yesNo = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABEL: Record<(typeof DAYS)[number], string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

export const SECTIONS: Section[] = [
  {
    title: "Who we're talking to",
    intro: "We only use this to check details with you. It never appears on the site.",
    fields: [
      { key: "venue_name", label: "Venue name", required: true, maxLength: 80 },
      { key: "branches", label: "Other branches (if any)", placeholder: "e.g. Mirdif, Al Barsha", help: "One form per branch is ideal. If you'd rather not, list them here and we'll follow up." },
      { key: "contact_name", label: "Your name", required: true },
      { key: "contact_role", label: "Your role", placeholder: "Owner, manager, marketing" },
      { key: "contact_whatsapp", label: "Your WhatsApp number", type: "tel", required: true, placeholder: "+971 5X XXX XXXX" },
      { key: "contact_email", label: "Your email", type: "email", required: true },
      { key: "contact_best_time", label: "Best time to reach you", placeholder: "e.g. weekdays after 2pm" },
    ],
  },
  {
    title: "The basics",
    fields: [
      { key: "address", label: "Address", required: true, help: "As it appears on Google Maps." },
      { key: "inside", label: "Inside a mall, park or hotel?", placeholder: "e.g. The Springs Souk, first floor" },
      { key: "maps_url", label: "Google Maps link", type: "url", help: "Open your venue in Google Maps, tap Share, paste the link. This is how we place you on the map." },
      { key: "indoor_outdoor", label: "Indoor or outdoor", type: "select", required: true, options: [{ value: "indoor", label: "Indoor" }, { value: "outdoor", label: "Outdoor" }, { value: "mixed", label: "Both" }] },
      { key: "tagline", label: "What children do here, in one line", required: true, maxLength: TAGLINE_MAX, placeholder: "e.g. Trampolines, foam pit and a ninja course for 4 to 14s", help: `Max ${TAGLINE_MAX} characters. This is the line parents see first.` },
      { key: "description", label: "A short description", type: "textarea", maxLength: DESCRIPTION_MAX, help: "Two or three plain sentences. No superlatives needed, parents can judge." },
      { key: "duration", label: "How long do families usually stay?", type: "select", options: [{ value: "45", label: "Under an hour" }, { value: "90", label: "1 to 2 hours" }, { value: "180", label: "2 to 4 hours" }, { value: "300", label: "Half a day or more" }] },
      { key: "website", label: "Website", type: "url" },
      { key: "instagram", label: "Instagram handle", placeholder: "without the @" },
      { key: "booking_whatsapp", label: "WhatsApp number parents should use to book or ask", type: "tel", placeholder: "+971 ..." },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "booking_url", label: "Online booking link", type: "url" },
      { key: "booking", label: "Do parents need to book?", type: "select", options: [{ value: "walk_in", label: "No, just turn up" }, { value: "recommended", label: "Recommended, especially weekends" }, { value: "required", label: "Yes, always" }] },
    ],
  },
  {
    title: "Ages and rules",
    fields: [
      { key: "age_min", label: "Minimum age", placeholder: "e.g. 6 months, 3 years", required: true },
      { key: "age_max", label: "Maximum age", placeholder: "e.g. 12 years, no limit", required: true },
      { key: "best_ages", label: "Which ages enjoy it most?", placeholder: "e.g. 4 to 10 years" },
      { key: "height_rules", label: "Height or other rules", placeholder: "e.g. Trampolines need 100cm or taller" },
      { key: "adult_stays", label: "Do adults have to stay?", type: "select", options: [{ value: "stay", label: "Yes, an adult stays" }, { value: "drop_off", label: "Drop-off allowed" }, { value: "drop_off_age", label: "Drop-off allowed from a certain age" }] },
      { key: "drop_off_age", label: "If drop-off is allowed, from what age?", placeholder: "e.g. 5 years" },
    ],
  },
  {
    title: "Prices",
    intro: "We publish list prices without discounts so parents can compare. Tell us how it works and we'll show it clearly.",
    fields: [
      { key: "price_model", label: "How is entry priced?", type: "select", required: true, options: [{ value: "free", label: "Free entry" }, { value: "per_child", label: "Per child" }, { value: "per_person", label: "Per person, adults pay too" }, { value: "per_family", label: "Per family" }, { value: "from", label: "Varies, from a starting price" }, { value: "classes", label: "Classes or packages only" }] },
      { key: "price_child", label: "Child price in AED", type: "number", placeholder: "e.g. 95" },
      { key: "price_adult", label: "Adult price in AED (leave blank if adults are free)", type: "number" },
      { key: "free_under", label: "Free under what age?", placeholder: "e.g. under 1, under 2" },
      { key: "session_length", label: "What does the price cover?", placeholder: "e.g. 90 minutes, all day, one class" },
      { key: "price_notes", label: "Anything else about prices", type: "textarea", placeholder: "Toddler rates, off-peak prices, how many adults go free" },
      { key: "prices_ok", label: "We agree to Ziggadoo publishing these prices", type: "checkbox", required: true, help: "Without this we show 'contact for prices', which parents tend to skip past." },
    ],
  },
  {
    title: "Opening hours",
    intro: "Use 24-hour times like 10:00-22:00, or write 'closed'.",
    fields: [
      ...DAYS.map((d) => ({ key: `hours_${d}`, label: DAY_LABEL[d], placeholder: "10:00-22:00" })),
      { key: "hours_notes", label: "Seasonal changes", type: "textarea", placeholder: "Summer hours, Ramadan hours, closures" },
    ],
  },
  {
    title: "Facilities",
    intro: "Tick what applies.",
    fields: FACILITIES.map((f) => ({ key: `fac_${f.key}`, label: f.label, type: "checkbox" as const })),
  },
  {
    title: "Good for",
    intro: "These become filters parents use. Only tick what's true today.",
    fields: [
      { key: "gf_homeschool", label: "Homeschoolers: we run or welcome weekday daytime sessions for learning groups", type: "checkbox" },
      { key: "gf_sunflower", label: "We are a member of the Hidden Disabilities Sunflower scheme and our staff are trained", type: "checkbox" },
      { key: "gf_coffee-watch", label: "Coffee and watch: our café has a view of the play area", type: "checkbox" },
      { key: "gf_toddler-sessions", label: "We run sessions reserved for under-3s", type: "checkbox" },
      { key: "gf_rainy-day", label: "We are fully indoor", type: "checkbox" },
    ],
  },
  {
    title: "Birthday parties",
    intro: "Parents compare party venues on one thing first: what does a starter package for 10 children cost, and what's in it. Give us that and you appear in the party comparison.",
    fields: [
      { key: "party_hosts", label: "Do you host birthday parties?", type: "select", required: true, options: yesNo },
      { key: "party_starter_price", label: "Starter package price for 10 children, in AED", type: "number" },
      { key: "party_includes", label: "What that includes", type: "textarea", placeholder: "e.g. 90 minutes of play, private party room for 45 minutes, a host, pizza or nuggets, juice" },
      { key: "party_duration", label: "Total party length", placeholder: "e.g. 2 hours" },
      { key: "party_min_kids", label: "Minimum number of children", type: "number" },
      { key: "party_max_kids", label: "Maximum number of children", type: "number" },
      { key: "party_extra_child", label: "Price per extra child, AED", type: "number" },
      { key: "party_food", label: "Food and drink options", placeholder: "e.g. pizza, nuggets, fruit platters, juice" },
      { key: "party_cake", label: "Cake policy", type: "select", options: [{ value: "bring", label: "Bring your own" }, { value: "buy", label: "Order through us" }, { value: "either", label: "Either" }] },
      { key: "party_theme", label: "Themed decoration add-on and price", placeholder: "e.g. Paw Patrol, unicorns; AED 350" },
      { key: "party_addons", label: "Other common add-ons", type: "textarea", placeholder: "Face painting, extra time, goodie bags, with prices" },
      { key: "party_lead_time", label: "How far ahead should parents book?", placeholder: "e.g. 2 weeks" },
      { key: "party_whatsapp", label: "WhatsApp number for party enquiries", type: "tel" },
      { key: "party_prices_ok", label: "We agree to Ziggadoo publishing this package and its price", type: "checkbox", help: "Without this we show 'parties available, contact for prices' and you don't appear in the comparison." },
    ],
  },
  {
    title: "Offers and anything else",
    fields: [
      { key: "offer", label: "Any standing offer for Ziggadoo parents?", type: "textarea", placeholder: "e.g. 10% off weekday mornings, free juice with every party booking" },
      { key: "notes", label: "Anything else we should know", type: "textarea" },
    ],
  },
];

export const ALL_FIELDS: Field[] = SECTIONS.flatMap((s) => s.fields);
export const PHOTO_MIN = 1;
export const PHOTO_MAX = 10;

export type SubmittedPhoto = { url: string; caption: string };

/** Map a submission's answers into the venue columns the admin edit page understands. Anything we can't map stays in the submission. */
export function toVenuePatch(d: Record<string, string>, photos: SubmittedPhoto[]) {
  const num = (k: string) => { const n = Number(d[k]); return d[k] && Number.isFinite(n) ? n : null; };
  const yes = (k: string) => d[k] === "yes" || d[k] === "on" || d[k] === "true";
  const hours: Record<string, string> = {};
  for (const day of DAYS) if (d[`hours_${day}`]) hours[day] = d[`hours_${day}`].trim();
  if (d.hours_notes) hours.note = d.hours_notes;
  const facilities: Record<string, boolean> = {};
  for (const f of FACILITIES) if (yes(`fac_${f.key}`)) facilities[f.key] = true;
  const categories: string[] = [];
  for (const g of GOOD_FOR) if (yes(`gf_${g.key}`)) categories.push(g.key);
  if (yes("party_hosts") && yes("party_prices_ok") && num("party_starter_price") != null) categories.push("party-venue");
  const priceModel = d.price_model === "classes" ? "unknown" : (d.price_model || "unknown");
  const party = yes("party_hosts") ? {
    hosts: true, starter_price: num("party_starter_price"), includes: d.party_includes || null, duration: d.party_duration || null,
    min_kids: num("party_min_kids"), max_kids: num("party_max_kids"), extra_child: num("party_extra_child"), food: d.party_food || null,
    cake: d.party_cake || null, theme: d.party_theme || null, addons: d.party_addons || null, lead_time: d.party_lead_time || null,
    whatsapp: d.party_whatsapp || null, prices_ok: yes("party_prices_ok"),
  } : { hosts: false };
  return {
    name: d.venue_name, tagline: (d.tagline || "").slice(0, TAGLINE_MAX) || null, description: d.description || null,
    address: d.address || null, indoor_outdoor: (["indoor", "outdoor", "mixed"].includes(d.indoor_outdoor) ? d.indoor_outdoor : "indoor"),
    website: d.website || null, instagram: (d.instagram || "").replace(/^@/, "") || null, whatsapp: d.booking_whatsapp || null, phone: d.phone || null,
    booking_url: d.booking_url || null, booking: (["walk_in", "recommended", "required"].includes(d.booking) ? d.booking : "walk_in"),
    typical_duration_min: num("duration"), height_note: d.height_rules || null,
    price_model: priceModel, price_child_aed: num("price_child"), price_adult_aed: num("price_adult"), adult_entry_free: d.price_model === "per_child" ? (num("price_adult") == null) : null,
    price_notes: [d.session_length, d.price_notes, d.free_under ? `Free under ${d.free_under}.` : ""].filter(Boolean).join(" ") || null,
    prices_ok: yes("prices_ok"), opening_hours: hours, seasonal_notes: d.hours_notes || null, facilities, categories, party,
    hero_image_url: photos[0]?.url ?? null,
    confidence_notes: `Submitted by the venue (${d.contact_name}, ${d.contact_whatsapp}). Ages given as: ${d.age_min} to ${d.age_max}${d.best_ages ? `, best ${d.best_ages}` : ""}. ${d.inside ? `Inside: ${d.inside}. ` : ""}${d.maps_url ? `Map: ${d.maps_url}. ` : ""}Set ages in months and the map pin before publishing.`,
    contact_name: d.contact_name || null, contact_email: (d.contact_email || "").toLowerCase() || null, contact_whatsapp: d.contact_whatsapp || null,
    status: "draft" as const, source: "business" as const,
  };
}
