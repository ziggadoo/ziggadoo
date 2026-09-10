const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function newPassCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return "ZG-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ziggadoo.com";

/** Today's date in Dubai as YYYY-MM-DD. */
export function dubaiToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function aed(n: number | string | null | undefined): string {
  return n == null || n === "" ? "" : `AED ${Number(n) % 1 === 0 ? Number(n) : Number(n).toFixed(2)}`;
}
