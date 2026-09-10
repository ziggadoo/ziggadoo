import { adminClient } from "@/lib/supabase/admin";
import Logo from "@/components/Logo";
import { aed, dubaiToday, fmtDate } from "@/lib/pass";
import { markUsed } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check a pass", robots: { index: false } };

export default async function CheckPass({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase().trim();
  const db = adminClient();
  const { data: p } = await db.from("passes").select("code, ticket_name, ziggadoo_price_aed, price_aed, visit_date, kids, status, used_at, venues(name)").eq("code", code).maybeSingle();
  const today = dubaiToday();
  const state = !p ? "unknown" : p.visit_date < today ? "expired" : p.visit_date > today ? "future" : p.status === "used" ? "used" : "valid";
  const tone = state === "valid" ? "bg-pool/40" : state === "used" ? "bg-sun/40" : "bg-persimmon/20";
  const title = { valid: "Valid today", used: "Already used today", expired: "Expired", future: "Not valid today", unknown: "Not a Ziggadoo pass" }[state];

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:px-6">
      <Logo className="h-6" />
      <section className={`mt-6 rounded-3xl p-5 ring-1 ring-ink/10 ${tone}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Pass check</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
        {p ? (
          <dl className="mt-4 grid gap-1 text-sm">
            <R k="Code" v={p.code} /><R k="Venue" v={(p.venues as unknown as { name: string } | null)?.name ?? ""} />
            <R k="Ticket" v={p.ticket_name} /><R k="Ziggadoo price" v={aed(p.ziggadoo_price_aed)} />
            <R k="Valid on" v={fmtDate(p.visit_date)} />{p.kids && <R k="Kids" v={String(p.kids)} />}
            {p.used_at && <R k="Used at" v={new Date(p.used_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })} />}
          </dl>
        ) : <p className="mt-2 text-sm">Code {code} isn&apos;t in our system.</p>}
      </section>
      {state === "valid" && (
        <form action={markUsed.bind(null, code)} className="mt-4">
          <button className="w-full rounded-2xl bg-ink px-4 py-3 text-lg font-bold text-oat">Mark as used</button>
          <p className="mt-2 text-xs text-ink/55">Optional. Stops the same pass being shown twice today.</p>
        </form>
      )}
      <p className="mt-6 text-xs text-ink/55">For venue staff: apply the Ziggadoo price shown, then take payment as usual. Questions: post@ziggadoo.com.</p>
    </main>
  );
}

function R({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 border-t border-ink/10 py-1"><dt className="text-ink/60">{k}</dt><dd className="font-bold">{v}</dd></div>;
}
