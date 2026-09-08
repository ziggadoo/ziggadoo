export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <header>
        <span className="text-2xl font-extrabold tracking-tight">ziggadoo</span>
      </header>

      <section>
        <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight">
          What shall we do today?
        </h1>
        <p className="mt-5 max-w-[32ch] text-lg leading-snug text-ink/70">
          Every kids' place in Dubai, sorted for your children's ages, the weather, and what it will actually cost your family.
        </p>
      </section>

      <footer className="text-sm text-ink/60">
        Opening soon. Built in Dubai.
      </footer>
    </main>
  );
}
