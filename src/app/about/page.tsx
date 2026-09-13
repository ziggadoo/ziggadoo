import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "About", description: "Ziggadoo is made by parents, for parents. An independent guide to things to do with kids in Dubai." };

export default function About() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Link href="/" className="text-sm font-bold text-cobalt">← Find activities</Link><Logo className="h-6" /></div>
      <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight">Made by parents, for parents</h1>
      <div className="mt-5 grid gap-4 leading-relaxed">
        <p>Ziggadoo started with a very ordinary Saturday morning question: what shall we do today? Somewhere the toddler is allowed in, the eight year old won&apos;t be bored, not too far, and we&apos;d like to know the price before we get there.</p>
        <p>So we built the tool we wanted. Tell it your kids&apos; ages and where you are, and it shows you places that actually fit all of them, with list prices, hours, age limits and the small things you only find out on the day, like which ride needs 130 cm.</p>
        <p>We are a small, independent team of parents in Dubai. Nobody pays to be at the top of the list. The best places for your family come first, and that will not change. Venues can claim their listing for free to keep details accurate, and paid partner options fund the site without touching the order of results.</p>
        <p>Every listing is checked by us or by parents who have been there. Prices are the list prices venues publish, without discounts, and we confirm them with venues regularly. If something is wrong, tap Report on the listing and we will fix it.</p>
        <p>Reviews come from real visits. Photos are our own, from parents, or shared by venues with permission. We do not copy marketing material.</p>
        <p>Have a place we should know about? <Link href="/suggest" className="font-bold text-cobalt">Tip us</Link>. Run a venue? <Link href="/for-venues" className="font-bold text-cobalt">Here is how listing works</Link>. Anything else, <Link href="/contact" className="font-bold text-cobalt">get in touch</Link>.</p>
      </div>
    </main>
  );
}
