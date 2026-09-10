import Link from "next/link";
export const metadata = { title: "Terms of use" };
export default function Terms() {
  return (
    <main className="prose-sm mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm font-bold text-cobalt">← Home</Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Terms of use</h1>
      <p className="mt-1 text-xs text-ink/50">Last updated 9 September 2026</p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
        <p>Ziggadoo (ziggadoo.com) is operated by Nordic Bridge Global FZ-LLC, licensed in Ras Al Khaimah Economic Zone, United Arab Emirates ("we", "us"). By using the site you agree to these terms.</p>
        <h2 className="font-extrabold">1. What Ziggadoo is</h2>
        <p>Ziggadoo is a directory of places and activities for families in Dubai. We collect information from public sources, from venues and from parents. We are not the operator of any venue and we do not sell tickets.</p>
        <p>A Ziggadoo pass is free. It shows a price that the venue has agreed with us for the date on the pass. The venue takes payment directly; Ziggadoo takes no money and no commission. A pass is not a booking: it does not reserve a place or guarantee entry, and a venue may decline it if the date or ticket shown does not match. If a venue does not honour a valid pass, tell us from the pass page and we will follow up.</p>
        <h2 className="font-extrabold">2. Accuracy</h2>
        <p>We work to keep listings accurate, but prices, opening hours, age limits and availability change without notice. Family cost estimates are estimates. Always confirm with the venue before you visit or pay. We are not liable for any loss arising from inaccurate listing information.</p>
        <h2 className="font-extrabold">3. Reviews and contributions</h2>
        <p>When you post a review, report, photo, tip or correction you confirm it is based on your own genuine experience, that you own the content or have the right to share it, and you grant us a worldwide, royalty-free licence to publish, edit and display it on Ziggadoo and in our marketing. Keep contributions about the place and your visit. Do not post personal information about staff or other visitors, accusations of illegal conduct, insults, or anything you know to be false. We review contributions before publishing and may edit, decline or remove them at our discretion. Under UAE law, including Federal Decree-Law No. 34 of 2021, you are responsible for what you publish.</p>
        <h2 className="font-extrabold">4. Venue owners</h2>
        <p>Venues may be listed without prior consent using publicly available information. Owners and managers can claim a listing to correct details, respond to reviews and add offers. We verify claims before granting access. Reviews that follow our guidelines are not removed at a venue&apos;s request; a venue may reply publicly or contact us at post@ziggadoo.com about content it believes breaches these terms.</p>
        <h2 className="font-extrabold">5. Accounts</h2>
        <p>You must be 18 or older to create an account. You are responsible for activity under your account. We may suspend accounts that breach these terms.</p>
        <h2 className="font-extrabold">6. Intellectual property</h2>
        <p>Ziggadoo&apos;s name, design, illustrations and compiled data are ours. Venue names and marks belong to their owners and are used to identify them.</p>
        <h2 className="font-extrabold">7. Liability</h2>
        <p>The site is provided as is. To the extent permitted by law we exclude liability for indirect or consequential loss, and our total liability to you is limited to AED 100.</p>
        <h2 className="font-extrabold">8. Law</h2>
        <p>These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai. Contact: post@ziggadoo.com.</p>
      </div>
    </main>
  );
}
