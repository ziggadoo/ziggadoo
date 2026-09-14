"use client";

import { useEffect, useRef, useState } from "react";

export const OUT_W = 1200;
export const OUT_H = 800;
export const JPEG_QUALITY = 0.82;

/** Loads any image source (File or public URL) into a bitmap the canvas can read.
 *  Tries createImageBitmap first (respects EXIF rotation), then falls back to an <img> decode, which handles more formats on Safari. */
export async function loadBitmap(src: File | string): Promise<ImageBitmap> {
  let blob: Blob;
  if (typeof src === "string") {
    const res = await fetch(src, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error("Couldn't load the image for cropping.");
    blob = await res.blob();
  } else blob = src;
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch (first) {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } catch {
      const name = typeof src === "string" ? "this image" : src.name;
      throw new Error(`Your browser can't read ${name}${/\.hei[cf]$/i.test(name) ? " (HEIC). Export it as JPEG first, or upload from an iPhone or Mac" : ""}. ${first instanceof Error ? first.message : ""}`.trim());
    } finally { URL.revokeObjectURL(url); }
  }
}

/** Centre crop to 3:2 and encode as JPEG. Used when the admin skips the crop step. */
export async function autoCrop(bitmap: ImageBitmap): Promise<Blob> {
  const target = OUT_W / OUT_H;
  let sw = bitmap.width, sh = bitmap.height;
  if (sw / sh > target) sw = Math.round(sh * target); else sh = Math.round(sw / target);
  return encode(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh);
}

function encode(bitmap: ImageBitmap, sx: number, sy: number, sw: number, sh: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W; canvas.height = OUT_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't encode the image."))), "image/jpeg", JPEG_QUALITY));
}

type Props = { bitmap: ImageBitmap; title: string; onDone: (blob: Blob) => void; onCancel: () => void };

/** Drag to move, pinch or scroll to zoom. The frame is always 3:2 and the result is 1200 x 800 JPEG. */
export default function ImageCropper({ bitmap, title, onDone, onCancel }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(320);
  const frameH = Math.round(frameW * OUT_H / OUT_W);
  const cover = Math.max(frameW / bitmap.width, frameH / bitmap.height); // zoom 1 = fills the frame
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image offset in frame px
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Draw the photo once at a preview size; CSS scales it while cropping.
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const k = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    c.width = Math.round(bitmap.width * k); c.height = Math.round(bitmap.height * k);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  }, [bitmap]);

  useEffect(() => {
    const el = frameRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
    ro.observe(el); setFrameW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  // Recentre when the frame size changes.
  useEffect(() => { setPos(clamp({ x: (frameW - bitmap.width * cover) / 2, y: (frameH - bitmap.height * cover) / 2 }, 1)); }, [frameW]); // eslint-disable-line react-hooks/exhaustive-deps

  function clamp(p: { x: number; y: number }, z: number) {
    const w = bitmap.width * cover * z, h = bitmap.height * cover * z;
    return { x: Math.min(0, Math.max(frameW - w, p.x)), y: Math.min(0, Math.max(frameH - h, p.y)) };
  }
  function setZoomAt(z: number, cx: number, cy: number) {
    const nz = Math.min(4, Math.max(1, z));
    const k = nz / zoom;
    setPos((p) => clamp({ x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k }, nz));
    setZoom(nz);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom }; drag.current = null;
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const rect = frameRef.current!.getBoundingClientRect();
      setZoomAt(pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    } else if (drag.current) {
      const d = drag.current;
      setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }, zoom));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    const rect = frameRef.current!.getBoundingClientRect();
    setZoomAt(zoom * (e.deltaY < 0 ? 1.08 : 0.93), e.clientX - rect.left, e.clientY - rect.top);
  }

  async function done() {
    setBusy(true);
    try {
      const s = cover * zoom; // frame px per image px
      onDone(await encode(bitmap, -pos.x / s, -pos.y / s, frameW / s, frameH / s));
    } finally { setBusy(false); }
  }

  const scale = cover * zoom;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3" role="dialog" aria-label="Crop image">
      <div className="w-full max-w-xl rounded-3xl bg-oat p-4">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-ink/60">Drag to move, pinch or scroll to zoom. What&apos;s inside the frame is what the listing shows (3:2).</p>
        <div ref={frameRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}
          className="relative mt-3 w-full touch-none select-none overflow-hidden rounded-2xl bg-ink/10 ring-2 ring-sun" style={{ height: frameH, cursor: "grab" }}>
          <canvas ref={canvasRef} style={{ position: "absolute", left: pos.x, top: pos.y, width: bitmap.width * scale, height: bitmap.height * scale }} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoomAt(Number(e.target.value), frameW / 2, frameH / 2)} className="flex-1" aria-label="Zoom" />
          <span className="w-12 text-right text-xs text-ink/60">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl bg-white px-4 py-2 text-sm font-bold ring-1 ring-ink/15">Cancel</button>
          <button type="button" onClick={done} disabled={busy} className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-oat disabled:opacity-40">{busy ? "Saving…" : "Use this crop"}</button>
        </div>
      </div>
    </div>
  );
}
