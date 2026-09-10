import Link from "next/link";
import Logo from "@/components/Logo";
import { submitEnquiry } from "./actions";

export const metadata = { title: "For venues" };
const field = "mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";

export default async function ForVenues({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Get your venue in front of Dubai parents</h1>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink/85">
        <p>Ziggadoo answers one question for parents: what shall we do today? They tell us their kids&apos; ages and where they&apos;re starting from, and we show them the places that fit, with real prices, hours and what other parents thought.</p>
        <p>We are made by parents, for parents. Ranking is never for sale: the best places for a family come first, and no one can pay to move up. What you can do is make sure your listing is complete, accurate and yours.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><span className="font-bold">Free listing.</span> Your details, photos, prices and hours, kept accurate, with a link parents use to book or WhatsApp you.</li>
          <li><span className="font-bold">Birthday parties.</span> Share a starter package and price, and you appear in the party comparison parents use to shortlist venues.</li>
          <li><span className="font-bold">Founding partners.</span> We&apos;re building a paid tier with offers, party enquiries sent straight to you, and placements in our parent newsletter. Early venues shape it and get it first.</li>
        </ul>
        <p>Ready to list? <Link href="/venues/submit" className="font-bold text-cobalt">Fill in the venue form</Link>. Want to talk first? Use the form below and we&apos;ll come back to you on WhatsApp.</p>
      </div>

      <h2 className="mt-10 text-xl font-extrabold tracking-tight">Get in touch</h2>
      {msg === "ok" ? <p className="mt-3 rounded-2xl bg-pool/30 p-4">Thanks, we&apos;ll be in touch within two working days.</p> : (
        <form action={submitEnquiry} className="mt-3 grid gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10">
          <label className="text-xs font-semibold text-ink/60">Your name<input name="name" required className={field} /></label>
          <label className="text-xs font-semibold text-ink/60">Venue<input name="venue_name" required className={field} /></label>
          <label className="text-xs font-semibold text-ink/60">WhatsApp number<input name="whatsapp" type="tel" placeholder="+971 ..." className={field} /></label>
          <label className="text-xs font-semibold text-ink/60">Email<input name="email" type="email" className={field} /></label>
          <label className="text-xs font-semibold text-ink/60">What would you like to know?<textarea name="message" rows={3} className={field} /></label>
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">Send</button>
          {msg && <p className="text-sm text-persimmon">{msg === "missing" ? "Please add your name, the venue, and a WhatsApp number or email." : msg}</p>}
        </form>
      )}
    </main>
  );
}
