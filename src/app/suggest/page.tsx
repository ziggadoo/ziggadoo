import Link from "next/link";
import { submitSuggestion } from "./actions";

export const metadata = { title: "Tip us about a place" };
const field = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";

export default async function Suggest({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <Link href="/" className="text-sm font-bold text-cobalt">← Home</Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Know a place we&apos;re missing?</h1>
      <p className="mt-2 text-ink/70">Tell us the name and roughly where it is. We&apos;ll do the rest.</p>
      {msg === "ok" ? <p className="mt-6 rounded-2xl bg-pool/30 p-4">Thank you. We&apos;ll check it out and add it.</p> : (
        <form action={submitSuggestion} className="mt-6 grid gap-3">
          <input name="name" required placeholder="Name of the place" className={field} />
          <input name="area" placeholder="Area (e.g. Al Quoz)" className={field} />
          <input name="url" placeholder="Website or Instagram (optional)" className={field} />
          <textarea name="note" rows={3} placeholder="Anything worth knowing? Ages, prices, why you like it" className={field} />
          <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">Send tip</button>
          {msg && msg !== "ok" && <p className="text-sm text-persimmon">{msg === "name" ? "Please add a name." : msg}</p>}
        </form>
      )}
    </main>
  );
}
