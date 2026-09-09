"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function shrink(file: File, max = 1200, quality = 0.72): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}

export default function PhotoUpload({ venueId, slug, signedIn }: { venueId: string; slug: string; signedIn: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  if (!signedIn) return <p className="mt-3 text-sm text-ink/60"><a href={`/login?next=/v/${slug}%23photo`} className="font-bold text-cobalt">Sign in</a> to add a photo.</p>;

  async function upload() {
    if (!file) return;
    setState("busy"); setErr("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const blob = await shrink(file);
      if (blob.size > 400_000) throw new Error("Image still too large after compression");
      const path = `venues/${venueId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage.from("venue-photos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (upErr) throw upErr;
      const url = `${SUPABASE_URL}/storage/v1/object/public/venue-photos/${path}`;
      const { error: dbErr } = await supabase.from("venue_photos").insert({ venue_id: venueId, storage_path: url, caption: caption.trim() || null, is_community: true, submitted_by: user.id, status: "pending" });
      if (dbErr) throw dbErr;
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e)); setState("error");
    }
  }

  if (state === "done") return <p className="mt-3 text-sm">Thanks. Photos show once we&apos;ve checked them.</p>;
  return (
    <div className="mt-4 grid gap-3">
      <label className="flex cursor-pointer items-center gap-3">
        <span className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/20">{file ? "Change photo" : "Choose photo"}</span>
        <span className="min-w-0 truncate text-sm text-ink/60">{file ? file.name : "No photo chosen yet"}</span>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
      </label>
      <label className="text-sm">Description of photo (optional)
        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} placeholder="e.g. Toddler area for under 2s" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt" />
      </label>
      <p className="text-xs text-ink/50">Photos are resized on your phone before upload, so big files are fine. By uploading you confirm it&apos;s your own photo and you&apos;re happy for us to show it.</p>
      <button type="button" disabled={!file || state === "busy"} onClick={upload} className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat disabled:opacity-40">{state === "busy" ? "Uploading…" : "Upload photo"}</button>
      {err && <p className="text-sm text-persimmon">{err}</p>}
    </div>
  );
}
