import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { moderate } from "./actions";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

function Buttons({ kind, id }: { kind: string; id: string }) {
  return (
    <form action={moderate} className="flex gap-2">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
      <button name="decision" value="approve" className="rounded-lg bg-ink px-3 py-1 text-xs font-bold text-oat">Approve</button>
      <button name="decision" value="reject" className="rounded-lg bg-white px-3 py-1 text-xs font-bold ring-1 ring-ink/20">Reject</button>
    </form>
  );
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") redirect("/");

  const [reviews, photos, claims, suggestions, reports, venues] = await Promise.all([
    supabase.from("reviews").select("id, rating, body, good_for_party, party_note, loved_it_ages_months, created_at, venues(name, slug), profiles(display_name)").eq("status", "pending").order("created_at"),
    supabase.from("venue_photos").select("id, storage_path, caption, created_at, venues(name, slug)").eq("status", "pending").order("created_at"),
    supabase.from("venue_claims").select("id, business_email, evidence, created_at, venues(name, slug, website)").eq("status", "pending").order("created_at"),
    supabase.from("venue_suggestions").select("id, name, area, url, note, created_at").eq("status", "pending").order("created_at"),
    supabase.from("reports").select("id, kind, note, created_at, venues(name, slug)").eq("status", "open").order("created_at"),
    q ? supabase.from("venues").select("id, name, area, status, price_model, last_verified_at").ilike("name", `%${q}%`).order("name").limit(50)
      : supabase.from("venues").select("id, name, area, status, price_model, last_verified_at").eq("price_model", "unknown").order("name").limit(50),
  ]);
  const vname = (v: unknown) => (v as { name: string; slug: string } | null);
  const box = "rounded-2xl bg-white p-3 ring-1 ring-ink/10 text-sm";

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Logo /><span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold">Admin</span></div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Moderation</h1>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Reviews ({reviews.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {reviews.data?.map((r) => (
          <div key={r.id} className={box}>
            <div className="flex justify-between"><b>{vname(r.venues)?.name}</b><span>{"★".repeat(r.rating)} · {(r.profiles as unknown as { display_name: string | null } | null)?.display_name ?? "?"}</span></div>
            {r.body && <p className="mt-1">{r.body}</p>}
            {r.good_for_party != null && <p className="mt-1 text-xs">{r.good_for_party ? "Good for parties" : "Not for parties"} {r.party_note}</p>}
            <div className="mt-2"><Buttons kind="review" id={r.id} /></div>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Photos ({photos.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {photos.data?.map((p) => (
          <div key={p.id} className={box + " flex gap-3"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.storage_path} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><b>{vname(p.venues)?.name}</b><p className="text-xs text-ink/70">{p.caption}</p><div className="mt-2"><Buttons kind="photo" id={p.id} /></div></div>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Claims ({claims.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {claims.data?.map((c) => {
          const v = c.venues as unknown as { name: string; slug: string; website: string | null } | null;
          const domainMatch = !!(v?.website && c.business_email && new URL(v.website).hostname.replace(/^www\./, "") === c.business_email.split("@")[1]);
          return (
            <div key={c.id} className={box}>
              <b>{v?.name}</b> · {c.business_email} {domainMatch ? <span className="rounded bg-pool/40 px-1 text-xs font-bold">email domain matches website</span> : <span className="rounded bg-sun/40 px-1 text-xs font-bold">verify manually</span>}
              <p className="mt-1 text-xs text-ink/70">{c.evidence}</p>
              <div className="mt-2"><Buttons kind="claim" id={c.id} /></div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Reports ({reports.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {reports.data?.map((r) => (
          <div key={r.id} className={box}><b>{vname(r.venues)?.name}</b> · {r.kind}<p className="mt-1">{r.note}</p><div className="mt-2 flex items-center gap-3"><Buttons kind="report" id={r.id} /><Link href={`/v/${vname(r.venues)?.slug}`} className="text-xs font-bold text-cobalt">Open listing</Link></div></div>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Tips: new places ({suggestions.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {suggestions.data?.map((s) => (
          <div key={s.id} className={box}><b>{s.name}</b> · {s.area} {s.url && <a href={s.url} className="text-cobalt underline" target="_blank" rel="noreferrer">link</a>}<p className="mt-1">{s.note}</p><div className="mt-2"><Buttons kind="suggestion" id={s.id} /></div></div>
        ))}
      </div>

      <h1 className="mt-10 text-3xl font-extrabold tracking-tight">Venues</h1>
      <form method="get" className="mt-3 flex gap-2"><input name="q" defaultValue={q ?? ""} placeholder="Search by name" className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2" /><button className="rounded-xl bg-ink px-4 py-2 font-bold text-oat">Find</button></form>
      <p className="mt-2 text-xs text-ink/50">{q ? `Results for "${q}"` : "Showing venues with no confirmed price. Search to find any venue."}</p>
      <ul className="mt-2 grid gap-1">
        {venues.data?.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink/10">
            <span><b>{v.name}</b> <span className="text-ink/50">· {v.area} · {v.status}{v.last_verified_at ? " · verified" : ""}</span></span>
            <Link href={`/admin/venues/${v.id}`} className="font-bold text-cobalt">Edit</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
