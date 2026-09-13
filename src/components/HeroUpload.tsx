"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function shrink(file: File, max = 1800, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}

/** Admin only: uploads a hero image to storage and drops the URL into the hero_image_url field of the surrounding form. Save persists it. */
export default function HeroUpload({ venueId, current }: { venueId: string; current: string | null }) {
  const [url, setUrl] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const supabase = createClient();
      const blob = await shrink(file);
      const path = `venues/${venueId}/hero-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("venue-photos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      const u = `${SUPABASE_URL}/storage/v1/object/public/venue-photos/${path}`;
      setUrl(u);
      const input = document.querySelector<HTMLInputElement>('input[name="hero_image_url"]');
      if (input) input.value = u;
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" className="h-14 w-24 rounded-xl object-cover ring-1 ring-ink/10" /> : <div className="flex h-14 w-24 items-center justify-center rounded-xl bg-ink/5 text-xs text-ink/40">illustration</div>}
      <label className="cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-bold ring-1 ring-ink/20">{busy ? "Uploading…" : "Upload main image"}<input type="file" accept="image/*" disabled={busy} onChange={(e) => onPick(e.target.files?.[0])} className="sr-only" /></label>
      <span className="text-xs text-ink/50">Then press Save below.</span>
      {err && <span className="text-xs text-persimmon">{err}</span>}
    </div>
  );
}
