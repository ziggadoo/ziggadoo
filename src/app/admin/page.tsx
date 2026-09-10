import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { moderate, approveSubmission, rejectSubmission, closeEnquiry, callDone, closePassReport } from "./actions";
import { SECTIONS, type SubmittedPhoto } from "@/lib/venueForm";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

function Buttons({ kind, id }: { kind: string; id: string }) {
  return (
    <form className="flex gap-2">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
      <button type="submit" formAction={moderate.bind(null, "approve")} className="rounded-lg bg-ink px-3 py-1 text-xs font-bold text-oat">Approve</button>
      <button type="submit" formAction={moderate.bind(null, "reject")} className="rounded-lg bg-white px-3 py-1 text-xs font-bold ring-1 ring-ink/20">Reject</button>
    </form>
  );
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string; msg?: string }> }) {
  const { q, msg } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") redirect("/");

  const [reviews, photos, claims, suggestions, reports, venues, submissions, enquiries, callList, passReports, passes] = await Promise.all([
    supabase.from("reviews").select("id, rating, body, good_for_party, party_note, loved_it_ages_months, created_at, venues(name, slug), profiles(display_name)").eq("status", "pending").order("created_at"),
    supabase.from("venue_photos").select("id, storage_path, caption, created_at, venues(name, slug)").eq("status", "pending").order("created_at"),
    supabase.from("venue_claims").select("id, business_email, evidence, created_at, venues(name, slug, website)").eq("status", "pending").order("created_at"),
    supabase.from("venue_suggestions").select("id, name, area, url, note, created_at").eq("status", "pending").order("created_at"),
    supabase.from("reports").select("id, kind, note, created_at, venues(name, slug)").eq("status", "open").order("created_at"),
    supabase.from("venues").select("id, name, area, status, price_model, last_verified_at").ilike("name", q ? `%${q}%` : "%").order("name").limit(300),
    supabase.from("venue_submissions").select("id, venue_name, contact_name, contact_whatsapp, contact_email, data, photos, created_at").eq("status", "pending").order("created_at"),
    supabase.from("venue_enquiries").select("id, name, venue_name, whatsapp, email, message, created_at").eq("status", "open").order("created_at"),
    supabase.from("venues").select("id, name, contact_name, contact_whatsapp, contact_email, prices_confirmed_at").eq("needs_call", true).order("name"),
    supabase.from("pass_reports").select("id, note, created_at, passes(code, visit_date, ticket_name, ziggadoo_price_aed, venues(name, contact_whatsapp))").order("created_at"),
    supabase.from("passes").select("visit_date, status, venues(name)").gte("visit_date", new Date(Date.now() - 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" })).order("created_at", { ascending: false }).limit(500),
  ]);
  const passByVenue = new Map<string, number>();
  for (const p of passes.data ?? []) { const n = (p.venues as unknown as { name: string } | null)?.name ?? "?"; passByVenue.set(n, (passByVenue.get(n) ?? 0) + 1); }
  const vname = (v: unknown) => (v as { name: string; slug: string } | null);
  const box = "rounded-2xl bg-white p-3 ring-1 ring-ink/10 text-sm";

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Logo /><span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold">Admin</span></div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Moderation</h1>
      {msg === "nodecision" && <p className="mt-2 rounded-xl bg-sun/40 px-3 py-2 text-sm">That tap didn&apos;t register a decision, nothing was changed. Please try again.</p>}
      {msg && msg !== "nodecision" && <p className="mt-2 rounded-xl bg-persimmon/15 px-3 py-2 text-sm">Could not save: {msg}</p>}

      <p className="mt-3 text-sm">Venues edit their own listing at <a href="/venue/manage" target="_blank" rel="noreferrer" className="font-bold text-cobalt">ziggadoo.com/venue/manage</a> (email link). Venue form to send to venues: <a href="/venues/submit" target="_blank" rel="noreferrer" className="font-bold text-cobalt">ziggadoo.com/venues/submit</a> (works without the access code, not indexed).</p>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Pass problems ({passReports.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {passReports.data?.map((r) => {
          const p = r.passes as unknown as { code: string; visit_date: string; ticket_name: string; ziggadoo_price_aed: number | null; venues: { name: string; contact_whatsapp: string | null } | null } | null;
          return <div key={r.id} className={box + " bg-persimmon/10"}><b>{p?.venues?.name}</b> didn&apos;t honour {p?.code} ({p?.ticket_name}, AED {p?.ziggadoo_price_aed}, {p?.visit_date}){p?.venues?.contact_whatsapp && <> · <a className="text-cobalt underline" href={`https://wa.me/${p.venues.contact_whatsapp.replace(/\D/g, "")}`}>WhatsApp venue</a></>}{r.note && <p className="mt-1">{r.note}</p>}<form className="mt-2"><button type="submit" formAction={closePassReport.bind(null, r.id)} className="rounded-lg bg-white px-3 py-1 text-xs font-bold ring-1 ring-ink/20">Resolved</button></form></div>;
        })}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Call list: venues that haven&apos;t confirmed ({callList.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {callList.data?.map((c) => (
          <div key={c.id} className={box + " flex flex-wrap items-center justify-between gap-2"}>
            <span><b>{c.name}</b> · {c.contact_name} {c.contact_whatsapp && <a className="text-cobalt underline" href={`https://wa.me/${c.contact_whatsapp.replace(/\D/g, "")}`}>{c.contact_whatsapp}</a>} <span className="text-ink/50">· last confirmed {c.prices_confirmed_at ? new Date(c.prices_confirmed_at).toLocaleDateString("en-GB") : "never"}</span></span>
            <span className="flex gap-2"><Link href={`/admin/venues/${c.id}`} className="text-xs font-bold text-cobalt">Edit</Link><form><button type="submit" formAction={callDone.bind(null, c.id)} className="rounded-lg bg-ink px-3 py-1 text-xs font-bold text-oat">Confirmed by phone</button></form></span>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Passes, last 30 days ({passes.data?.length ?? 0})</h2>
      <p className="mt-1 text-xs text-ink/70">{[...passByVenue.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}: ${c}`).join(" · ") || "None yet."}</p>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Venue submissions ({submissions.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {submissions.data?.map((s) => {
          const d = (s.data ?? {}) as Record<string, string>;
          const ph = (s.photos ?? []) as SubmittedPhoto[];
          return (
            <details key={s.id} className={box}>
              <summary className="cursor-pointer"><b>{s.venue_name}</b> · {s.contact_name}, {s.contact_whatsapp} · {new Date(s.created_at).toLocaleDateString("en-GB")} · {ph.length} photo{ph.length === 1 ? "" : "s"}</summary>
              <div className="mt-3 grid gap-3">
                {SECTIONS.map((sec) => {
                  const rows = sec.fields.filter((f) => d[f.key]);
                  if (!rows.length) return null;
                  return <div key={sec.title}><p className="text-xs font-bold uppercase tracking-wide text-ink/50">{sec.title}</p><dl className="mt-1 grid gap-0.5 text-xs">{rows.map((f) => <div key={f.key} className="flex gap-2"><dt className="w-40 shrink-0 text-ink/60">{f.label}</dt><dd className="min-w-0 break-words">{d[f.key]}</dd></div>)}</dl></div>;
                })}
                {ph.length > 0 && <div className="flex gap-2 overflow-x-auto">{ph.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="shrink-0"><img src={p.url} alt="" className="h-20 w-20 rounded-xl object-cover" /><p className="w-20 truncate text-[10px] text-ink/60">{p.caption}</p></a>
                ))}</div>}
                <form className="flex gap-2">
                  <button type="submit" formAction={approveSubmission.bind(null, s.id)} className="rounded-lg bg-ink px-3 py-1 text-xs font-bold text-oat">Approve: create draft venue</button>
                  <button type="submit" formAction={rejectSubmission.bind(null, s.id)} className="rounded-lg bg-white px-3 py-1 text-xs font-bold ring-1 ring-ink/20">Reject</button>
                </form>
                <p className="text-[11px] text-ink/50">Approve creates a draft listing with the photos attached. You then set ages in months, the map pin and the area on the edit page, and switch status to verified.</p>
              </div>
            </details>
          );
        })}
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Venue enquiries ({enquiries.data?.length ?? 0})</h2>
      <div className="mt-2 grid gap-2">
        {enquiries.data?.map((e) => (
          <div key={e.id} className={box}>
            <b>{e.venue_name}</b> · {e.name} · {e.whatsapp && <a href={`https://wa.me/${e.whatsapp.replace(/\D/g, "")}`} className="text-cobalt underline" target="_blank" rel="noreferrer">{e.whatsapp}</a>} {e.email && <a href={`mailto:${e.email}`} className="text-cobalt underline">{e.email}</a>}
            {e.message && <p className="mt-1">{e.message}</p>}
            <form className="mt-2"><button type="submit" formAction={closeEnquiry.bind(null, e.id)} className="rounded-lg bg-white px-3 py-1 text-xs font-bold ring-1 ring-ink/20">Mark handled</button></form>
          </div>
        ))}
      </div>

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
      <p className="mt-2 text-xs text-ink/50">{venues.data?.length ?? 0} venues{q ? ` matching "${q}"` : ""}. Orange dot = no confirmed price.</p>
      <ul className="mt-2 grid gap-1">
        {venues.data?.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink/10">
            <span>{v.price_model === "unknown" && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-persimmon" />}<b>{v.name}</b> <span className="text-ink/50">· {v.area}{v.status !== "verified" ? ` · ${v.status}` : ""}{v.last_verified_at ? " · checked" : ""}</span></span>
            <Link href={`/admin/venues/${v.id}`} className="font-bold text-cobalt">Edit</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
