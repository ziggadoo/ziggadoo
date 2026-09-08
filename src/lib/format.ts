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
  switch (v.price_model) {
    case "free": return "Free entry";
    case "unknown": return "Price not confirmed";
    case "from": return child != null ? `From AED ${child}` : "Price varies";
    case "per_child": return child != null ? `AED ${child} per child${v.adult_entry_free ? ", adults free" : adult != null ? `, adults AED ${adult}` : ""}` : "Per child";
    case "per_person": return child != null && adult != null && child !== adult ? `AED ${child} child, AED ${adult} adult` : child != null ? `AED ${child} per person` : "Per person";
    case "per_family": return adult != null ? `AED ${adult} per family` : "Per family";
    default: return "";
  }
}

/** Estimated total for the given kids' ages (months) and adults, or null when it can't be computed. */
export function familyTotal(v: Priced, kidAges: number[], adults: number): number | null {
  const child = n(v.price_child_aed);
  const adult = n(v.price_adult_aed);
  if (v.price_model === "free") return 0;
  if (v.price_model === "unknown" || kidAges.length === 0) return null;
  const payingKids = kidAges.filter((a) => v.free_under_months == null || a >= v.free_under_months);
  if (v.price_model === "per_child" || v.price_model === "from") {
    if (child == null) return null;
    const adultsCost = v.adult_entry_free ? 0 : adult != null ? adult * adults : 0;
    return child * payingKids.length + adultsCost;
  }
  if (v.price_model === "per_person") {
    if (child == null) return null;
    return child * payingKids.length + (adult ?? child) * adults;
  }
  return null;
}
