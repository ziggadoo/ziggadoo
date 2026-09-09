import Link from "next/link";
export const metadata = { title: "Contact" };
export default function Contact() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm font-bold text-cobalt">← Home</Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Contact</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
        <p>Email us at <a href="mailto:post@ziggadoo.com" className="font-bold text-cobalt">post@ziggadoo.com</a>. We reply within two working days.</p>
        <p>Spotted a mistake on a listing? The fastest route is the &quot;Something wrong? Report it&quot; button on the venue page. Know a place we don&apos;t have? <Link href="/suggest" className="font-bold text-cobalt">Tip us</Link>.</p>
        <p>Venue owners: use &quot;Claim it&quot; on your listing, or email us with your trade licence and the listing link.</p>
        <p className="text-sm text-ink/60">Ziggadoo is a brand of Nordic Bridge Global FZ-LLC, RAKEZ, United Arab Emirates.</p>
      </div>
    </main>
  );
}
