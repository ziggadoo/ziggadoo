import Logo from "@/components/Logo";
import Link from "next/link";
import { sendMagicLink, signInWithGoogle } from "./actions";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; email?: string; error?: string; next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next ?? "/";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight">Sign in to review, report and claim</h1>
      <p className="mt-2 text-ink/70">No password. We email you a link, or use Google.</p>
      {sp.sent ? (
        <p className="mt-6 rounded-2xl bg-pool/30 p-4">Check <b>{sp.email}</b> for a sign-in link. It works on this device.</p>
      ) : (
        <>
          <form action={sendMagicLink} className="mt-6 flex gap-2">
            <input type="hidden" name="next" value={next} />
            <input name="email" type="email" required placeholder="you@email.com" autoComplete="email"
              className="min-w-0 flex-1 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-cobalt" />
            <button className="rounded-2xl bg-ink px-5 py-3 font-bold text-oat">Send link</button>
          </form>
          {googleEnabled && (
            <form action={signInWithGoogle} className="mt-3">
              <input type="hidden" name="next" value={next} />
              <button className="w-full rounded-2xl bg-white px-5 py-3 font-bold ring-1 ring-ink/15">Continue with Google</button>
            </form>
          )}
        </>
      )}
      {sp.error && <p className="mt-3 text-sm text-persimmon">Something went wrong: {sp.error}</p>}
      <p className="mt-8 text-xs text-ink/50">By signing in you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</p>
    </main>
  );
}
