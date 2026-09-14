"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageCropper, { autoCrop, loadBitmap } from "@/components/ImageCropper";
import { setHero, insertPhoto, updatePhoto, deletePhotoRecord, reorderPhotos } from "@/app/admin/photoActions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "venue-photos";

export type PhotoRow = { id: string; storage_path: string; caption: string | null; status: string; is_community: boolean; sort_order: number };

type Item = {
  key: string;                 // photo id, "hero", or "orphan:<path>"
  photoId: string | null;      // venue_photos row, if any
  url: string;                 // public URL as stored (may carry ?v=)
  bucket: string | null; path: string | null; // parsed from the URL, null for external URLs
  caption: string | null; isCommunity: boolean; status: string;
  size?: number; w?: number; h?: number;
  orphan?: boolean;            // sits in storage but is not on the listing
};

const stripV = (u: string) => u.replace(/\?v=\d+$/, "");
function parse(url: string): { bucket: string; path: string } | null {
  const m = stripV(url).match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null;
}
const publicUrl = (bucket: string, path: string) => `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
const kb = (n?: number) => (n == null ? "size unknown" : n >= 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const fileName = (it: Item) => (it.path ? it.path.split("/").pop()! : stripV(it.url).split("/").pop() || "external image");

type Queued = { file: File; name: string };

/** Admin only. Every image on a listing in one place: see file name and size, crop, reorder, set the main image, delete. New uploads are named <slug>-<n>.jpg. */
export default function PhotoManager({ venueId, slug, venueName, hero, photos }: { venueId: string; slug: string; venueName: string; hero: string | null; photos: PhotoRow[] }) {
  const [heroUrl, setHeroUrl] = useState(hero);
  const [items, setItems] = useState<Item[]>(() => buildItems(hero, photos));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [queue, setQueue] = useState<Queued[]>([]);
  const [crop, setCrop] = useState<{ bitmap: ImageBitmap; title: string; onDone: (b: Blob) => Promise<void> } | null>(null);
  const [orphans, setOrphans] = useState<{ path: string; size?: number }[]>([]);

  // On load: list this venue's folder in storage for sizes and orphans, then measure everything.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.storage.from(BUCKET).list(`venues/${venueId}`, { limit: 200 });
      const sizes = new Map<string, number>();
      const known = new Set(items.map((it) => it.path && it.bucket === BUCKET ? it.path : null).filter(Boolean));
      const found: { path: string; size?: number }[] = [];
      (data ?? []).forEach((f) => {
        if (!f.name || f.id == null) return;
        const p = `venues/${venueId}/${f.name}`;
        sizes.set(p, Number((f.metadata as { size?: number } | null)?.size ?? NaN));
        if (!known.has(p)) found.push({ path: p, size: Number((f.metadata as { size?: number } | null)?.size ?? NaN) || undefined });
      });
      setOrphans(found);
      setItems((prev) => prev.map((it) => ({ ...it, size: it.path && sizes.has(it.path) && !Number.isNaN(sizes.get(it.path)) ? sizes.get(it.path) : it.size })));
      // Files outside our bucket (e.g. venue-submissions): ask the server for the size.
      for (const it of items) {
        if (it.size == null && (!it.path || it.bucket !== BUCKET)) {
          try { const r = await fetch(stripV(it.url), { method: "HEAD" }); const n = Number(r.headers.get("content-length")); if (n) setItems((prev) => prev.map((x) => x.key === it.key ? { ...x, size: n } : x)); } catch { /* ignore */ }
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function measured(key: string, w: number, h: number) { setItems((prev) => prev.map((x) => x.key === key && (x.w !== w || x.h !== h) ? { ...x, w, h } : x)); }

  /** Next free number for <slug>-<n>.jpg across everything we can see. */
  function nextNumber(): number {
    const re = new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)\\.jpg$`);
    let max = 0;
    [...items.map(fileName), ...orphans.map((o) => o.path.split("/").pop()!)].forEach((n) => { const m = n.match(re); if (m) max = Math.max(max, Number(m[1])); });
    return max + 1;
  }

  async function uploadBlob(path: string, blob: Blob) {
    const supabase = createClient();
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: true });
    if (error) throw error;
    return `${publicUrl(BUCKET, path)}?v=${Date.now()}`;
  }
  async function removeObject(bucket: string | null, path: string | null) {
    if (!bucket || !path) return;
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }
  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label); setErr("");
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    setBusy("");
  }

  // ---- add photos: each goes through the cropper (or auto centre crop), then storage, then a venue_photos row.
  function pick(list: FileList | null) {
    if (!list?.length) return;
    setQueue((q) => [...q, ...Array.from(list).map((file) => ({ file, name: file.name }))]);
  }
  useEffect(() => {
    if (!queue.length || crop || busy) return;
    const next = queue[0];
    (async () => {
      try {
        const bitmap = await loadBitmap(next.file);
        setCrop({ bitmap, title: `Crop ${next.name}`, onDone: async (blob) => { setCrop(null); await addPhoto(blob); setQueue((q) => q.slice(1)); } });
      } catch (e) { setErr(e instanceof Error ? e.message : String(e)); setQueue((q) => q.slice(1)); }
    })();
  }, [queue, crop, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addPhoto(blob: Blob) {
    await run("Uploading…", async () => {
      const n = nextNumber();
      const path = `venues/${venueId}/${slug}-${n}.jpg`;
      const url = await uploadBlob(path, blob);
      const order = items.filter((i) => i.photoId).length + 1;
      const id = await insertPhoto(venueId, slug, url, null, order);
      const it: Item = { key: id, photoId: id, url, bucket: BUCKET, path, caption: null, isCommunity: false, status: "approved", size: blob.size };
      setItems((prev) => [...prev, it]);
      if (!heroUrl) { await setHero(venueId, slug, url); setHeroUrl(url); }
    });
  }
  async function skipCrop() {
    if (!crop) return;
    const c = crop; setCrop(null);
    const blob = await autoCrop(c.bitmap);
    await c.onDone(blob);
  }

  // ---- existing photos
  async function recrop(it: Item) {
    await run("Loading…", async () => {
      const bitmap = await loadBitmap(stripV(it.url));
      setCrop({ bitmap, title: `Crop ${fileName(it)}`, onDone: async (blob) => {
        setCrop(null);
        await run("Saving…", async () => {
          // Overwrite in place when the file already lives in our bucket, otherwise give it a proper name in our bucket.
          const path = it.bucket === BUCKET && it.path ? it.path : `venues/${venueId}/${slug}-${nextNumber()}.jpg`;
          const url = await uploadBlob(path, blob);
          if (it.photoId) await updatePhoto(venueId, slug, it.photoId, { storage_path: url });
          const wasHero = heroUrl && stripV(heroUrl) === stripV(it.url);
          if (wasHero) { await setHero(venueId, slug, url); setHeroUrl(url); }
          if (path !== it.path) await removeObject(it.bucket, it.path);
          setItems((prev) => prev.map((x) => x.key === it.key ? { ...x, url, bucket: BUCKET, path, size: blob.size, w: undefined, h: undefined } : x));
        });
      } });
    });
  }
  async function makeHero(it: Item) {
    await run("Saving…", async () => { await setHero(venueId, slug, it.url); setHeroUrl(it.url); });
  }
  async function del(it: Item) {
    if (!confirm(`Delete ${fileName(it)} for good? This removes the file from storage too.`)) return;
    await run("Deleting…", async () => {
      if (it.photoId) await deletePhotoRecord(venueId, slug, it.photoId);
      if (heroUrl && stripV(heroUrl) === stripV(it.url)) { await setHero(venueId, slug, null); setHeroUrl(null); }
      // Only remove the file if nothing else on this listing still uses it.
      const stillUsed = items.some((x) => x.key !== it.key && stripV(x.url) === stripV(it.url));
      if (!stillUsed) await removeObject(it.bucket, it.path);
      setItems((prev) => prev.filter((x) => x.key !== it.key));
    });
  }
  async function delOrphan(path: string) {
    if (!confirm(`Delete ${path.split("/").pop()} from storage?`)) return;
    await run("Deleting…", async () => { await removeObject(BUCKET, path); setOrphans((o) => o.filter((x) => x.path !== path)); });
  }
  async function move(it: Item, dir: -1 | 1) {
    const rows = items.filter((x) => x.photoId && !x.isCommunity);
    const i = rows.findIndex((x) => x.key === it.key); const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const next = [...rows]; [next[i], next[j]] = [next[j], next[i]];
    await run("Saving…", async () => {
      await reorderPhotos(venueId, slug, next.map((x) => x.photoId!));
      setItems((prev) => { const others = prev.filter((x) => !(x.photoId && !x.isCommunity)); const heroFirst = others.filter((x) => x.key === "hero"); const rest = others.filter((x) => x.key !== "hero"); return [...heroFirst, ...next, ...rest]; });
    });
  }
  async function saveCaption(it: Item, caption: string) {
    if (!it.photoId || (it.caption ?? "") === caption.trim()) return;
    await run("Saving…", async () => { await updatePhoto(venueId, slug, it.photoId!, { caption: caption.trim() || null }); setItems((prev) => prev.map((x) => x.key === it.key ? { ...x, caption: caption.trim() || null } : x)); });
  }

  const official = items.filter((x) => !x.isCommunity);
  const community = items.filter((x) => x.isCommunity);
  const row = (it: Item, i: number, list: Item[]) => {
    const isHero = !!heroUrl && stripV(heroUrl) === stripV(it.url);
    const big = it.size != null && it.size > 400 * 1024;
    return (
      <li key={it.key} className={`flex gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ${isHero ? "ring-2 ring-sun" : "ring-ink/10"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.url} alt={venueName} onLoad={(e) => measured(it.key, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} className="h-20 shrink-0 rounded-xl object-cover" style={{ width: 120 }} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs">{fileName(it)}{isHero && <span className="ml-2 rounded-full bg-sun px-2 py-0.5 font-sans font-bold">Main image</span>}</p>
          <p className={`text-xs ${big ? "font-bold text-persimmon" : "text-ink/60"}`}>{it.w ? `${it.w} × ${it.h}` : "…"} · {kb(it.size)}{big ? " · large, crop to compress" : ""}{it.bucket && it.bucket !== BUCKET ? " · from venue form" : ""}{it.status !== "approved" ? ` · ${it.status}` : ""}</p>
          {it.photoId && <input defaultValue={it.caption ?? ""} onBlur={(e) => saveCaption(it, e.target.value)} maxLength={160} placeholder="Caption (optional)" className="mt-1 w-full rounded-lg border border-ink/15 px-2 py-1 text-xs outline-none focus:border-cobalt" />}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
            <button type="button" disabled={!!busy} onClick={() => recrop(it)} className="text-cobalt">Crop</button>
            {!isHero && <button type="button" disabled={!!busy} onClick={() => makeHero(it)} className="text-cobalt">Make main image</button>}
            {it.photoId && !it.isCommunity && <><button type="button" disabled={!!busy || i === 0} onClick={() => move(it, -1)} className="disabled:opacity-30">↑</button><button type="button" disabled={!!busy || i === list.length - 1} onClick={() => move(it, 1)} className="disabled:opacity-30">↓</button></>}
            <button type="button" disabled={!!busy} onClick={() => del(it)} className="text-persimmon">Delete</button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <section className="rounded-2xl bg-white/60 p-3 ring-1 ring-ink/10 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Photos on this listing</p>
        <label className={`cursor-pointer rounded-xl bg-ink px-3 py-2 text-xs font-bold text-oat ${busy ? "opacity-50" : ""}`}>{busy || "Add photos"}<input type="file" accept="image/*" multiple disabled={!!busy} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} className="sr-only" /></label>
      </div>
      <p className="mt-1 text-xs text-ink/60">Each new photo gets a 3:2 crop, is saved as 1200 × 800 JPEG and named {slug}-1.jpg, {slug}-2.jpg and so on. Changes here save immediately. The first photo becomes the main image if there isn&apos;t one.</p>
      {err && <p className="mt-2 text-xs text-persimmon">{err}</p>}
      {queue.length > 0 && <p className="mt-2 text-xs text-ink/60">{queue.length} photo{queue.length === 1 ? "" : "s"} waiting to be cropped.</p>}
      <ul className="mt-2 grid gap-2">{official.map((it, i) => row(it, i, official))}</ul>
      {official.length === 0 && <p className="mt-2 text-xs text-ink/50">No venue photos yet. The listing shows an illustration.</p>}
      {community.length > 0 && <><p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/50">Parent uploads</p><ul className="mt-1 grid gap-2">{community.map((it, i) => row(it, i, community))}</ul></>}
      {orphans.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/50">In storage but not on the listing</p>
          <ul className="mt-1 grid gap-1">
            {orphans.map((o) => (
              <li key={o.path} className="flex items-center gap-3 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicUrl(BUCKET, o.path)} alt="" className="h-10 w-14 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate font-mono">{o.path.split("/").pop()}</span><span className="text-ink/60">{kb(o.size)}</span>
                <button type="button" disabled={!!busy} onClick={() => delOrphan(o.path)} className="font-bold text-persimmon">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {crop && (
        <>
          <ImageCropper bitmap={crop.bitmap} title={crop.title} onDone={crop.onDone} onCancel={() => { setCrop(null); setQueue((q) => q.slice(1)); }} />
          <button type="button" onClick={skipCrop} className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-bold shadow ring-1 ring-ink/15">Skip, centre crop</button>
        </>
      )}
      {/* Part of the surrounding venue form, so pressing Save keeps whatever main image is set here. */}
      <input type="hidden" name="hero_image_url" value={heroUrl ?? ""} readOnly />
    </section>
  );
}

function buildItems(hero: string | null, photos: PhotoRow[]): Item[] {
  const rows: Item[] = photos.map((p) => { const b = parse(p.storage_path); return { key: p.id, photoId: p.id, url: p.storage_path, bucket: b?.bucket ?? null, path: b?.path ?? null, caption: p.caption, isCommunity: p.is_community, status: p.status }; });
  if (hero && !rows.some((r) => stripV(r.url) === stripV(hero))) {
    const b = parse(hero);
    rows.unshift({ key: "hero", photoId: null, url: hero, bucket: b?.bucket ?? null, path: b?.path ?? null, caption: null, isCommunity: false, status: "approved" });
  }
  return rows;
}
