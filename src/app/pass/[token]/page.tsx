import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { adminClient } from "@/lib/supabase/admin";
import Logo from "@/components/Logo";
import { aed, dubaiToday, fmtDate, SITE } from "@/lib/pass";
import { reportPass } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Ziggadoo pass", robots: { index: false } };

export default async function PassPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string; reported?: string }> }) {
  const { token } = await params; const { new: isNew, reported } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(token)) notFound();
  const db = adminClient();
  const { data: p } = await db.from("passes").select("code, ticket_name, price_aed, ziggadoo_price_aed, visit_date, kids, status, venues(name, slug, address, whatsapp, phone)").eq("token", token).maybeSingle();
  if (!p) notFound();
  const v = p.venues as unknown as { name: string; slug: string; address: string | null; whatsapp: string | null; phone: string | null };
  const today = dubaiToday();
  const state = p.visit_date < today ? "expired" : p.status === "used" ? "used" : p.visit_date > today ? "upcoming" : "today";
  const svg = await QRCode.toString(`${SITE}/pass/check/${p.code}`, { type: "svg", margin: 1, color: { dark: "#1c1a2e", light: "#ffffff" } });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " " + (v.address ?? "Dubai"))}`;

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Link href={`/v/${v.slug}`} className="text-sm font-bold text-cobalt">← {v.name}</Link><Logo className="h-6" /></div>
      {isNew && <p className="mt-4 rounded-2xl bg-pool/30 px-3 py-2 text-sm">Done. We&apos;ve emailed you this link too. Save it to your home screen if you like.</p>}
      {reported && <p className="mt-4 rounded-2xl bg-sun/40 px-3 py-2 text-sm">Thanks for telling us. We&apos;ll call the venue today.</p>}

      <section className={`mt-4 rounded-3xl p-5 text-center ring-1 ring-ink/10 ${state === "expired" ? "bg-ink/5" : "bg-white"}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Ziggadoo pass</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{v.name}</h1>
        <div className="mx-auto mt-4 w-56" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-3 text-3xl font-extrabold tracking-wide">{p.code}</p>
        <div className="mt-4 grid gap-1 text-left">
          <Row k="Ticket" v={p.ticket_name} />
          <Row k="Ziggadoo price" v={<span className="text-persimmon">{aed(p.ziggadoo_price_aed)}{p.price_aed ? <span className="text-ink/50"> (usually {aed(p.price_aed)})</span> : null}</span>} />
          <Row k="Valid on" v={<span className={state === "expired" ? "line-through" : ""}>{fmtDate(p.visit_date)}</span>} />
          {p.kids && <Row k="Kids" v={String(p.kids)} />}
        </div>
        <p className="mt-4 rounded-2xl bg-sun/40 px-3 py-2 text-sm font-bold">
          {state === "today" && "Show this at the door and pay the Ziggadoo price there."}
          {state === "upcoming" && `Valid ${fmtDate(p.visit_date)}. Show it at the door that day.`}
          {state === "used" && "This pass has been used."}
          {state === "expired" && "This pass has expired. Get a new one for your next visit."}
        </p>
      </section>

      <p className="mt-4 text-xs text-ink/55">Nothing has been charged and nothing is reserved. The venue applies the Ziggadoo price when you pay. If they need to check, they can scan the code: it shows the date and price and nothing about you.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink px-4 py-2.5 font-bold text-oat">Directions</a>
        {v.whatsapp && <a href={`https://wa.me/${v.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-pool px-4 py-2.5 font-bold">WhatsApp the venue</a>}
        {v.phone && <a href={`tel:${v.phone}`} className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Call</a>}
        {state === "expired" && <Link href={`/v/${v.slug}`} className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Get a new pass</Link>}
      </div>

      {(state === "today" || state === "used") && !reported && (
        <details className="mt-8 text-sm">
          <summary className="cursor-pointer font-bold text-ink/60">The venue didn&apos;t honour this pass</summary>
          <form action={reportPass.bind(null, token)} className="mt-2 grid gap-2">
            <textarea name="note" rows={2} placeholder="What happened? (optional)" className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt" />
            <button className="rounded-xl bg-persimmon px-4 py-2 font-bold text-white">Tell Ziggadoo</button>
          </form>
        </details>
      )}
    </main>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-t border-ink/10 py-1.5 text-sm"><span className="text-ink/60">{k}</span><span className="text-right font-bold">{v}</span></div>;
}
