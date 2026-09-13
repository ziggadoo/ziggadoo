"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const MAX_FILES = 8;

async function shrink(file: File, max = 1600, quality = 0.78): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}

type Item = { file: File; preview: string; caption: string };

export default function PhotoUpload({ venueId, slug, signedIn }: { venueId: string; slug: string; signedIn: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");
  if (!signedIn) return <p className="mt-3 text-sm text-ink/60"><a href={`/login?next=/v/${slug}%23photo`} className="font-bold text-cobalt">Sign in</a> to add photos.</p>;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).slice(0, MAX_FILES - items.length).map((file) => ({ file, preview: URL.createObjectURL(file), caption: "" }));
    setItems((p) => [...p, ...next]);
  }
  function remove(i: number) { setItems((p) => p.filter((_, j) => j !== i)); }
  function setCaption(i: number, caption: string) { setItems((p) => p.map((it, j) => (j === i ? { ...it, caption } : it))); }

  async function upload() {
    if (!items.length) return;
    setState("busy"); setErr(""); setProgress(0);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      for (let i = 0; i < items.length; i++) {
        const blob = await shrink(items[i].file);
        const path = `venues/${venueId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage.from("venue-photos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (upErr) throw upErr;
        const url = `${SUPABASE_URL}/storage/v1/object/public/venue-photos/${path}`;
        const { error: dbErr } = await supabase.from("venue_photos").insert({ venue_id: venueId, storage_path: url, caption: items[i].caption.trim() || null, is_community: true, submitted_by: user.id, status: "pending" });
        if (dbErr) throw dbErr;
        setProgress(i + 1);
      }
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e)); setState("error");
    }
  }

  if (state === "done") return <p className="mt-3 text-sm">Thanks, {items.length} photo{items.length === 1 ? "" : "s"} received. They show once we&apos;ve checked them.</p>;
  return (
    <div className="mt-4 grid gap-3">
      <label className="flex cursor-pointer items-center gap-3">
        <span className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/20">{items.length ? "Add more" : "Choose photos"}</span>
        <span className="min-w-0 truncate text-sm text-ink/60">{items.length ? `${items.length} chosen (max ${MAX_FILES})` : "Pick several at once from your camera roll"}</span>
        <input type="file" accept="image/*" multiple disabled={state === "busy" || items.length >= MAX_FILES} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} className="sr-only" />
      </label>
      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((it, i) => (
            <li key={it.preview} className="flex gap-3 rounded-2xl bg-oat/60 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <input value={it.caption} onChange={(e) => setCaption(i, e.target.value)} maxLength={160} placeholder="What's in this photo? (optional)" className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-cobalt" />
                <button type="button" onClick={() => remove(i)} className="mt-1 text-xs font-bold text-ink/50">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink/50">Full-size phone photos are fine, we resize them for you. By uploading you confirm they&apos;re your own photos and you&apos;re happy for us to show them.</p>
      <button type="button" disabled={!items.length || state === "busy"} onClick={upload} className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat disabled:opacity-40">{state === "busy" ? `Uploading ${progress + 1} of ${items.length}…` : `Upload ${items.length || ""} photo${items.length === 1 ? "" : "s"}`}</button>
      {err && <p className="text-sm text-persimmon">{err}</p>}
    </div>
  );
}
