import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/supabase/viewer";
import Logo from "@/components/Logo";
import { illustrationFor } from "@/lib/illustration";
import { ageRange, priceLine } from "@/lib/format";
import { toggleSaved } from "@/app/v/[slug]/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My places", robots: { index: false } };

type Row = { kind: string; created_at: string; venues: { id: string; slug: string; name: string; area: string | null; categories: string[] | null; hero_image_url: string | null; tagline: string | null; best_age_min_months: number | null; best_age_max_months: number | null; price_model: string; price_child_aed: number | null; price_adult_aed: number | null; adult_entry_free: boolean | null; free_under_months: number | null } | null };

export default async function SavedPage() {
  const { user } = await getViewer();
  if (!user) redirect("/login?next=/saved");
  const supabase = await createClient();
  const { data } = await supabase.from("saved_venues").select("kind, created_at, venues(id, slug, name, area, categories, hero_image_url, tagline, best_age_min_months, best_age_max_months, price_model, price_child_aed, price_adult_aed, adult_entry_free, free_under_months)").eq("profile_id", user.id).order("created_at", { ascending: false });
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.venues);
  const groups: [string, string, Row[]][] = [["saved", "Saved for later", rows.filter((r) => r.kind === "saved")], ["been", "We've been here", rows.filter((r) => r.kind === "been")]];

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Link href="/" className="text-sm font-bold text-cobalt">← Find activities</Link><Logo className="h-6" /></div>
      <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight">My places</h1>
      {rows.length === 0 && <p className="mt-4 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink/10">Nothing here yet. Tap the heart on any place to save it, or mark places you&apos;ve been to.</p>}
      {groups.map(([kind, title, list]) => list.length > 0 && (
        <section key={kind} className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">{title} ({list.length})</h2>
          <ul className="mt-2 grid gap-3">
            {list.map((r) => { const v = r.venues!; return (
              <li key={kind + v.id} className="flex min-w-0 gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Link href={`/v/${v.slug}`} className="shrink-0"><img src={illustrationFor(v.categories, v.hero_image_url)} alt="" className="h-24 w-20 rounded-2xl object-cover" /></Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/v/${v.slug}`} className="text-[17px] font-extrabold leading-tight tracking-tight">{v.name}</Link>
                  {v.tagline && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink/75">{v.tagline}</p>}
                  <p className="mt-1.5 text-xs text-ink/65"><span className="font-semibold text-ink/80">Ages {ageRange(v.best_age_min_months, v.best_age_max_months)}</span>{v.area ? <><span className="mx-1.5">·</span>{v.area}</> : null}</p>
                  <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                    <span className="font-bold">{priceLine(v)}</span>
                    <form action={toggleSaved}><input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="slug" value={v.slug} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="on" value="0" /><input type="hidden" name="back" value="/saved" /><button className="text-xs font-bold text-ink/50">Remove</button></form>
                  </div>
                </div>
              </li>
            ); })}
          </ul>
        </section>
      ))}
    </main>
  );
}
