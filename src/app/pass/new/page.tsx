import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import { createPass } from "./actions";
import { dubaiToday, aed } from "@/lib/pass";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get a Ziggadoo pass", robots: { index: false } };
const field = "mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";
const ERR: Record<string, string> = { email: "Please enter an email address so we can send you the pass.", date: "Pick today or a date in the next 30 days.", retry: "Something went wrong, please try again.", setup: "Passes aren't switched on yet. Please try again later." };

export default async function NewPass({ searchParams }: { searchParams: Promise<{ venue?: string; ticket?: string; msg?: string }> }) {
  const { venue, ticket, msg } = await searchParams;
  const supabase = await createClient();
  const { data: v } = await supabase.from("venues").select("id, name, slug, passes_enabled").eq("slug", venue ?? "").maybeSingle();
  if (!v || !v.passes_enabled) notFound();
  const { data: t } = await supabase.from("ticket_types").select("id, name, description, price_aed, ziggadoo_price_aed").eq("id", ticket ?? "").eq("venue_id", v.id).maybeSingle();
  if (!t || t.ziggadoo_price_aed == null) notFound();
  const today = dubaiToday();
  const max = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Link href={`/v/${v.slug}`} className="text-sm font-bold text-cobalt">← {v.name}</Link><Logo className="h-6" /></div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Get your Ziggadoo pass</h1>
      <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-ink/10">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{v.name}</p>
        <p className="mt-1 text-lg font-extrabold">{t.name}</p>
        {t.description && <p className="text-sm text-ink/70">{t.description}</p>}
        <p className="mt-2 text-2xl font-extrabold text-persimmon">{aed(t.ziggadoo_price_aed)} <span className="text-sm font-bold text-ink/50">Ziggadoo price{t.price_aed ? `, usually ${aed(t.price_aed)}` : ""}</span></p>
      </div>
      <p className="mt-4 text-sm text-ink/75">Show the pass at the door and pay the Ziggadoo price there. Nothing is charged now and nothing is reserved, so if plans change, just don&apos;t go.</p>
      {msg && <p className="mt-3 rounded-xl bg-persimmon/15 px-3 py-2 text-sm">{ERR[msg] ?? msg}</p>}
      <form action={createPass} className="mt-4 grid gap-3">
        <input type="hidden" name="venue" value={v.slug} /><input type="hidden" name="ticket" value={t.id} />
        <label className="text-xs font-semibold text-ink/60">When are you going?<input type="date" name="date" required defaultValue={today} min={today} max={max} className={field} /></label>
        <label className="text-xs font-semibold text-ink/60">How many kids?<select name="kids" defaultValue="1" className={field}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="text-xs font-semibold text-ink/60">Email, we&apos;ll send the pass here<input type="email" name="email" required autoComplete="email" className={field} /></label>
        <label className="text-xs font-semibold text-ink/60">WhatsApp (optional)<input type="tel" name="whatsapp" autoComplete="tel" placeholder="+971 ..." className={field} /></label>
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button className="rounded-xl bg-ink px-4 py-3 text-lg font-bold text-oat">Get my pass</button>
        <p className="text-xs text-ink/50">We use your email to send the pass and, a couple of days after your visit, one question about how it went. Nothing else.</p>
      </form>
    </main>
  );
}
