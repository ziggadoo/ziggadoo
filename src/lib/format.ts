export function ageLabel(months: number | null | undefined): string {
  if (months == null) return "";
  if (months < 24) return `${months}m`;
  return `${Math.floor(months / 12)}y`;
}

export function ageRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "All ages";
  if (min != null && max != null) return `${ageLabel(min)} to ${ageLabel(max)}`;
  if (min != null) return `${ageLabel(min)}+`;
  return `Up to ${ageLabel(max)}`;
}

export type Priced = {
  price_model: string;
  price_child_aed: number | string | null;
  price_adult_aed: number | string | null;
  adult_entry_free: boolean | null;
  free_under_months: number | null;
};

const n = (v: number | string | null) => (v == null ? null : Number(v));

export function priceLine(v: Priced): string {
  const child = n(v.price_child_aed);
  const adult = n(v.price_adult_aed);
  const adults = v.adult_entry_free ? ". Adult included in child pass" : adult != null ? `, adults ${adult} AED` : "";
  switch (v.price_model) {
    case "free": return "Free entry";
    case "unknown": return "Price not confirmed";
    case "from": return child != null ? `Starting at ${child} AED` : "Price varies";
    case "per_child": return child != null ? `Starting at ${child} AED per child${adults}` : "Per child";
    case "per_person": return child != null && adult != null && child !== adult ? `${child} AED child, ${adult} AED adult` : child != null ? `Starting at ${child} AED per person` : "Per person";
    case "per_family": return adult != null ? `${adult} AED per family` : "Per family";
    default: return "";
  }
}
