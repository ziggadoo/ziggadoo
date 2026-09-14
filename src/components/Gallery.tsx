"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryImage = { url: string; caption?: string | null };

/** Venue and admin photos at the top of a listing. Swipe on mobile, or use the arrows. One image is loaded eagerly, the rest lazily. */
export default function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const n = images.length;

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  function go(to: number) {
    const el = ref.current; if (!el) return;
    const i = (to + n) % n;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  if (n === 0) return null;
  const btn = "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-oat/90 text-lg font-bold text-ink shadow ring-1 ring-ink/10";
  return (
    <div className="relative mt-4">
      <ul ref={ref} className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl ring-1 ring-ink/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`${name} photos`}>
        {images.map((im, i) => (
          <li key={im.url} className="relative w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt={im.caption ? `${name}: ${im.caption}` : `${name} photo ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="aspect-[3/2] w-full object-cover" />
            {im.caption && <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-6 text-xs font-semibold text-oat">{im.caption}</p>}
          </li>
        ))}
      </ul>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous photo" className={btn + " left-2"}>‹</button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next photo" className={btn + " right-2"}>›</button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {images.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-oat" : "bg-oat/50"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
