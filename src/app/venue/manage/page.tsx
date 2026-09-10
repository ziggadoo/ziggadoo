import Logo from "@/components/Logo";
import { sendManageLink } from "./actions";

export const metadata = { title: "Manage your listing", robots: { index: false } };

export default async function Manage({ searchParams }: { searchParams: Promise<{ sent?: string; msg?: string }> }) {
  const { sent, msg } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Manage your listing</h1>
      <p className="mt-2 text-ink/75">Enter the email we have on file for your venue and we&apos;ll send you an edit link. No password needed.</p>
      {sent ? <p className="mt-6 rounded-2xl bg-pool/30 p-4">If that email is on file, the link is on its way. Check spam if it hasn&apos;t arrived in a few minutes.</p> : (
        <form action={sendManageLink} className="mt-6 grid gap-3">
          <input type="email" name="email" required placeholder="you@yourvenue.com" className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt" />
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">Send me the link</button>
          {msg && <p className="text-sm text-persimmon">Please enter a valid email.</p>}
        </form>
      )}
      <p className="mt-6 text-xs text-ink/55">Not listed yet? <a href="/venues/submit" className="font-bold text-cobalt">Add your venue</a>. Wrong email on file? Write to post@ziggadoo.com.</p>
    </main>
  );
}
