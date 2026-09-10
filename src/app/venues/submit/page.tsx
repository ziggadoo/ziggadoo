import Link from "next/link";
import Logo from "@/components/Logo";
import VenueSubmitForm from "@/components/VenueSubmitForm";
import { submitVenue } from "./actions";

export const metadata = { title: "Add your venue to Ziggadoo", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  missing: "Please fill in the venue name and your contact details.",
  photos: "Please add at least one photo.",
  consent: "Please tick the two confirmation boxes at the bottom.",
};

export default async function SubmitVenue({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <Logo />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Add your venue to Ziggadoo</h1>
      <p className="mt-3 text-ink/75">Ziggadoo helps Dubai parents find the right thing to do with their kids, for their ages, today. Listings are free. This form takes about 15 minutes, and what you tell us here is what parents see, so it&apos;s worth doing properly. Questions? WhatsApp us or write to <a href="mailto:post@ziggadoo.com" className="font-bold text-cobalt">post@ziggadoo.com</a>.</p>
      {msg === "ok" ? (
        <div className="mt-8 rounded-3xl bg-pool/30 p-5">
          <p className="text-lg font-bold">Thank you, we have it.</p>
          <p className="mt-1 text-sm">We&apos;ll check the details and be in touch on WhatsApp within two working days. <Link href="/for-venues" className="font-bold text-cobalt">Back to venue info</Link></p>
        </div>
      ) : (
        <>
          {msg && <p className="mt-4 rounded-xl bg-persimmon/15 px-3 py-2 text-sm">{ERRORS[msg] ?? `Something went wrong: ${msg}`}</p>}
          <VenueSubmitForm action={submitVenue} />
        </>
      )}
    </main>
  );
}
