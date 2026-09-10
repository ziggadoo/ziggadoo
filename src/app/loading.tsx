export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl animate-pulse px-4 pb-16 pt-6 sm:px-6">
      <div className="h-8 w-40 rounded bg-ink/10" />
      <div className="mt-6 h-10 w-3/4 rounded bg-ink/10" />
      <div className="mt-4 h-44 rounded-3xl bg-white/70" />
      <div className="mt-6 grid gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-3xl bg-white/70" />)}</div>
    </main>
  );
}
