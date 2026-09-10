export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl animate-pulse px-4 pb-16 pt-6 sm:px-6">
      <div className="h-4 w-32 rounded bg-ink/10" />
      <div className="mt-4 aspect-[2/1] w-full rounded-3xl bg-ink/10" />
      <div className="mt-4 flex gap-2"><div className="h-6 w-16 rounded-full bg-ink/10" /><div className="h-6 w-24 rounded-full bg-ink/10" /></div>
      <div className="mt-3 h-10 w-3/4 rounded bg-ink/10" />
      <div className="mt-2 h-5 w-1/2 rounded bg-ink/10" />
      <div className="mt-6 h-32 rounded-3xl bg-white/70" />
    </main>
  );
}
