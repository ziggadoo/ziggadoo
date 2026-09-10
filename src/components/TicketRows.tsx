"use client";

import { useState } from "react";

export type TicketRow = { id?: string; name: string; description: string | null; price_aed: number | string | null; ziggadoo_price_aed: number | string | null };

const field = "mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";

/** Editable ticket rows for admin and venue self-service. Field names are tt_<i>_<field>; the server reads up to 20 rows. */
export default function TicketRows({ tickets, compact = false }: { tickets: TicketRow[]; compact?: boolean }) {
  const [blank, setBlank] = useState(tickets.length === 0 ? 1 : 0);
  const rows: (TicketRow | null)[] = [...tickets, ...Array.from({ length: blank }, () => null)];
  return (
    <div className="grid gap-2">
      {rows.map((tk, i) => (
        <div key={tk?.id ?? `new-${i}`} className={`grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-ink/10 sm:grid-cols-6 ${compact ? "text-sm" : ""}`}>
          {tk?.id && <input type="hidden" name={`tt_${i}_id`} value={tk.id} />}
          <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Ticket<input name={`tt_${i}_name`} defaultValue={tk?.name ?? ""} placeholder={tk ? "" : "e.g. 2 hour play"} maxLength={50} className={field} /></label>
          <label className="text-xs font-semibold text-ink/60 sm:col-span-2">What&apos;s included<input name={`tt_${i}_description`} defaultValue={tk?.description ?? ""} placeholder="e.g. one child, socks included" maxLength={90} className={field} /></label>
          <label className="text-xs font-semibold text-ink/60">List price AED<input name={`tt_${i}_price`} type="number" inputMode="decimal" defaultValue={tk?.price_aed ?? ""} className={field} /></label>
          <label className="text-xs font-semibold text-ink/60">Ziggadoo price<input name={`tt_${i}_zprice`} type="number" inputMode="decimal" defaultValue={tk?.ziggadoo_price_aed ?? ""} className={field} /></label>
          {tk?.id && <label className="flex items-center gap-2 text-xs sm:col-span-6"><input type="checkbox" name={`tt_${i}_remove`} value="1" /> Remove this ticket</label>}
        </div>
      ))}
      {rows.length < 20 && <button type="button" onClick={() => setBlank((b) => b + 1)} className="justify-self-start rounded-xl bg-white px-3 py-1.5 text-sm font-bold ring-1 ring-ink/20">+ Add a ticket type</button>}
    </div>
  );
}
