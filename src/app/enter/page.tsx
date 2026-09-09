import Logo from "@/components/Logo";
export const metadata = { title: "Enter", robots: { index: false } };

export default async function Enter({ searchParams }: { searchParams: Promise<{ wrong?: string }> }) {
  const { wrong } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight">We&apos;re not open yet.</h1>
      <p className="mt-3 text-ink/70">If you have an access code, pop it in below.</p>
      <form method="post" action="/api/enter" className="mt-6 flex gap-2">
        <input name="code" type="password" autoComplete="off" placeholder="Access code" required
          className="min-w-0 flex-1 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-lg outline-none focus:border-cobalt" />
        <button type="submit" className="rounded-2xl bg-ink px-5 py-3 font-bold text-oat">Enter</button>
      </form>
      {wrong && <p className="mt-3 text-sm text-persimmon">That code didn&apos;t work. Try again.</p>}
    </main>
  );
}
