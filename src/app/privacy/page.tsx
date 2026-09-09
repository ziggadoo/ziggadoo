import Link from "next/link";
export const metadata = { title: "Privacy policy" };
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm font-bold text-cobalt">← Home</Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Privacy policy</h1>
      <p className="mt-1 text-xs text-ink/50">Last updated 9 September 2026</p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
        <p>Nordic Bridge Global FZ-LLC (Ziggadoo) is the data controller. We follow the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021).</p>
        <h2 className="font-extrabold">What we collect</h2>
        <p>Browsing: your approximate location only if you tap &quot;Use my location&quot;, and standard server logs. Account: your email address and, if you sign in with Google, your name and Google account ID. Optional: your children&apos;s first names and birthdates, saved only so we can sort places by their ages. Contributions: reviews, reports, tips and photos you submit.</p>
        <h2 className="font-extrabold">Why</h2>
        <p>To run the service, personalise results by age and distance, publish your contributions, verify venue claims, and contact you about your account. We do not sell personal data. We do not show advertising based on your children&apos;s data.</p>
        <h2 className="font-extrabold">Who sees it</h2>
        <p>Published reviews show your first name or display name, never your email. Data is processed by our providers Supabase (database and authentication) and Vercel (hosting), which may store it outside the UAE. Venue owners never receive your contact details unless you send them an enquiry.</p>
        <h2 className="font-extrabold">Your rights</h2>
        <p>You can view, correct or delete your account data, and withdraw consent, by emailing post@ziggadoo.com. We delete accounts on request within 30 days.</p>
        <h2 className="font-extrabold">Children</h2>
        <p>Ziggadoo is for parents. Accounts are for adults only. Children&apos;s details you add are stored to your account and you can remove them at any time.</p>
        <h2 className="font-extrabold">Cookies</h2>
        <p>We use only strictly necessary cookies: your sign-in session and, during preview, the access code. No advertising or tracking cookies.</p>
        <p>Questions: post@ziggadoo.com</p>
      </div>
    </main>
  );
}
