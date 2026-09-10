"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SECTIONS, PHOTO_MAX, PHOTO_MIN, type Field, type SubmittedPhoto } from "@/lib/venueForm";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const field = "mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";

async function shrink(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}

function Input({ f }: { f: Field }) {
  const [len, setLen] = useState(0);
  if (f.type === "checkbox") {
    return (
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name={f.key} value="yes" required={f.required} className="mt-1 h-4 w-4 shrink-0" />
        <span>{f.label}{f.required && <span className="text-persimmon"> *</span>}{f.help && <span className="block text-xs text-ink/55">{f.help}</span>}</span>
      </label>
    );
  }
  const label = <span className="text-xs font-semibold text-ink/60">{f.label}{f.required && <span className="text-persimmon"> *</span>}{f.maxLength && <span className="float-right font-normal">{len}/{f.maxLength}</span>}</span>;
  const common = { name: f.key, required: f.required, placeholder: f.placeholder, maxLength: f.maxLength, onChange: f.maxLength ? (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLen(e.target.value.length) : undefined };
  return (
    <label className="block">
      {label}
      {f.type === "textarea" ? <textarea {...common} rows={3} className={field} />
        : f.type === "select" ? (
          <select name={f.key} required={f.required} defaultValue="" className={field}>
            <option value="" disabled={f.required}>{f.required ? "Choose one" : "Not sure / skip"}</option>
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : <input {...common} type={f.type === "number" ? "number" : f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} inputMode={f.type === "number" ? "decimal" : undefined} className={field} />}
      {f.help && <span className="mt-1 block text-xs text-ink/55">{f.help}</span>}
    </label>
  );
}

export default function VenueSubmitForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [photos, setPhotos] = useState<SubmittedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [batch] = useState(() => crypto.randomUUID());

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setErr("");
    try {
      const supabase = createClient();
      const next = [...photos];
      for (const file of Array.from(files).slice(0, PHOTO_MAX - photos.length)) {
        const blob = await shrink(file);
        if (blob.size > 850_000) throw new Error(`${file.name} is still too large after resizing.`);
        const path = `${batch}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("venue-submissions").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (error) throw error;
        next.push({ url: `${SUPABASE_URL}/storage/v1/object/public/venue-submissions/${path}`, caption: "" });
      }
      setPhotos(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="mt-8 grid gap-8">
      {SECTIONS.map((s) => (
        <fieldset key={s.title} className="grid gap-4 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10 sm:p-5">
          <legend className="px-1 text-lg font-extrabold tracking-tight">{s.title}</legend>
          {s.intro && <p className="-mt-1 text-sm text-ink/70">{s.intro}</p>}
          {s.fields.map((f) => <Input key={f.key} f={f} />)}
        </fieldset>
      ))}

      <fieldset className="grid gap-4 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10 sm:p-5">
        <legend className="px-1 text-lg font-extrabold tracking-tight">Photos</legend>
        <p className="-mt-1 text-sm text-ink/70">At least {PHOTO_MIN}, ideally 4 to 7. Your own photos only, showing what children actually do. No identifiable children unless you have their parents&apos; permission. A one-line caption per photo helps a lot.</p>
        <label className="flex cursor-pointer items-center gap-3">
          <span className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/20">{busy ? "Uploading…" : "Choose photos"}</span>
          <span className="text-sm text-ink/60">{photos.length} of {PHOTO_MAX} added</span>
          <input type="file" accept="image/*" multiple disabled={busy || photos.length >= PHOTO_MAX} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} className="sr-only" />
        </label>
        {err && <p className="text-sm text-persimmon">{err}</p>}
        <ul className="grid gap-3">
          {photos.map((p, i) => (
            <li key={p.url} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <input value={p.caption} onChange={(e) => setPhotos(photos.map((q, j) => j === i ? { ...q, caption: e.target.value } : q))} maxLength={120} placeholder={i === 0 ? "Caption (this one becomes the main image)" : "Caption, e.g. Toddler area for under 2s"} className={field + " mt-0"} />
                <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="mt-1 text-xs font-bold text-persimmon">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <input type="hidden" name="photos" value={JSON.stringify(photos)} />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="photo_licence" value="yes" required={photos.length > 0} className="mt-1 h-4 w-4 shrink-0" />
          <span>These are our own photos and we give Ziggadoo permission to show them on our listing and in Ziggadoo&apos;s own channels.<span className="text-persimmon"> *</span></span>
        </label>
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="accurate" value="yes" required className="mt-1 h-4 w-4 shrink-0" />
        <span>The details above are accurate today, and we&apos;ll tell Ziggadoo when prices or hours change.<span className="text-persimmon"> *</span></span>
      </label>
      {/* Honeypot: bots fill it, people never see it. */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button disabled={busy} className="rounded-xl bg-ink px-4 py-3 text-lg font-bold text-oat disabled:opacity-40">Send to Ziggadoo</button>
      <p className="text-xs text-ink/55">We review every submission by hand and usually reply within two working days. Nothing goes live until we&apos;ve checked it.</p>
    </form>
  );
}
