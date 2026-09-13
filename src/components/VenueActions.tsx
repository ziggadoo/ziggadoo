import { submitClaim, submitReport, submitReview } from "@/app/v/[slug]/actions";
import PhotoUpload from "@/components/PhotoUpload";
import { MONTHS, VALUE_SCALE } from "@/lib/review";

const field = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";
const YesNo = ({ name, label, na = false, value }: { name: string; label: string; na?: boolean; value?: boolean | null }) => (
  <fieldset className="flex items-center justify-between gap-3 text-sm">
    <span>{label}</span>
    <span className="flex gap-3"><label><input type="radio" name={name} value="yes" defaultChecked={value === true} /> Yes</label><label><input type="radio" name={name} value="no" defaultChecked={value === false} /> No</label>{na && <label><input type="radio" name={name} value="na" defaultChecked={value == null} /> Not sure</label>}</span>
  </fieldset>
);

export type MyReview = { rating: number; status: string; value_score: number | null; visited_on: string | null; would_return: boolean | null; good_for_party: boolean | null; body: string | null } | null;

export default function VenueActions({ venueId, slug, msg, signedIn, displayName, myReview, claimed }: { venueId: string; slug: string; msg?: string; signedIn: boolean; displayName?: string | null; myReview: MyReview; claimed: boolean }) {
  const hidden = <><input type="hidden" name="venue_id" value={venueId} /><input type="hidden" name="slug" value={slug} /></>;
  const ok = (k: string) => msg === k;
  const err = msg && !msg.endsWith("-ok") && msg !== "rating" ? msg : null;
  const now = new Date();
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);
  const visited = myReview?.visited_on ? new Date(myReview.visited_on + "T12:00:00") : now;
  return (
    <section className="mt-8 grid gap-3">
      {!signedIn && <p className="text-sm text-ink/60">Been here? <a href={`/login?next=/v/${slug}`} className="font-bold text-cobalt">Sign in</a> to review, report a mistake or claim this venue. Takes 10 seconds, no password.</p>}
      {err && <p className="text-sm text-persimmon">Something went wrong: {err}</p>}

      <details id="review" className="rounded-3xl bg-white p-4 ring-1 ring-ink/10" open={msg?.startsWith("review") || msg === "rating"}>
        <summary className="cursor-pointer font-bold">Write a review {myReview && <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-xs">{myReview.status === "approved" ? "yours is live" : "yours is pending"}</span>}</summary>
        {ok("review-ok") ? <p className="mt-3 text-sm">Thank you. Reviews go live once we&apos;ve checked them, usually within a day.</p> : (
          <form action={submitReview} className="mt-4 grid gap-3">
            {hidden}
            <fieldset className="flex items-center justify-between text-sm"><span>Rating</span>
              <span className="flex gap-2">{[1,2,3,4,5].map((n) => <label key={n} className="flex flex-col items-center"><input type="radio" name="rating" value={n} required defaultChecked={myReview?.rating === n} />{n}</label>)}</span>
            </fieldset>
            <label className="text-sm">Show my name as<input name="display_name" defaultValue={displayName ?? ""} maxLength={40} placeholder="e.g. Sara, mum of two" className={field + " mt-1"} /></label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label>When did you visit?<select name="visited_month" defaultValue={String(visited.getMonth() + 1)} className={field + " mt-1"}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
              <label>&nbsp;<select name="visited_year" defaultValue={String(visited.getFullYear())} className={field + " mt-1"}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
            </div>
            <label className="text-sm">Ages of your kids who loved it (years)<input name="loved_ages" placeholder="e.g. 2, 6" className={field + " mt-1"} /></label>
            <YesNo name="would_return" label="Would you go back?" value={myReview?.would_return} />
            <label className="text-sm">Value for the price?<select name="value_score" defaultValue={myReview?.value_score ? String(myReview.value_score) : ""} className={field + " mt-1"}>
              <option value="">Not sure</option>{VALUE_SCALE.map((v) => <option key={v.score} value={v.score}>{v.label}</option>)}
            </select></label>
            <YesNo name="good_for_party" label="Good venue for a birthday party?" na value={myReview?.good_for_party} />
            <label className="text-sm">Party notes (price, what&apos;s included, what to watch)<input name="party_note" className={field + " mt-1"} /></label>
            <label className="text-sm">How long did you stay? (minutes)<input name="duration_min" type="number" min={15} max={720} className={field + " mt-1"} /></label>
            <label className="text-sm">Your review<textarea name="body" rows={4} defaultValue={myReview?.body ?? ""} placeholder="Describe your visit. Keep it about the place, not the people." className={field + " mt-1"} /></label>
            <label className="text-sm">Anything we should know? (private, only the Ziggadoo team sees this)<textarea name="admin_note" rows={2} placeholder="e.g. prices were different from the website, staff issue, safety concern" className={field + " mt-1"} /></label>
            {msg === "rating" && <p className="text-sm text-persimmon">Please pick a star rating.</p>}
            <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">{myReview ? "Update review" : "Submit review"}</button>
          </form>
        )}
      </details>

      <details id="report" className="rounded-3xl bg-white p-4 ring-1 ring-ink/10" open={msg?.startsWith("report")}>
        <summary className="cursor-pointer font-bold">Something wrong? Report it</summary>
        {ok("report-ok") ? <p className="mt-3 text-sm">Thanks, we&apos;ll check and fix it.</p> : (
          <form action={submitReport} className="mt-4 grid gap-3">
            {hidden}
            <select name="kind" className={field} defaultValue="wrong_price">
              <option value="closed">It&apos;s closed</option><option value="wrong_hours">Wrong opening hours</option><option value="wrong_price">Wrong price</option>
              <option value="wrong_ages">Wrong ages</option><option value="wrong_location">Wrong location</option><option value="other">Something else</option>
            </select>
            <textarea name="note" rows={3} placeholder="What should it say?" className={field} />
            <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">Send report</button>
          </form>
        )}
      </details>

      <details id="photo" className="rounded-3xl bg-white p-4 ring-1 ring-ink/10" open={msg?.startsWith("photo")}>
        <summary className="cursor-pointer font-bold">Add photos</summary>
        <PhotoUpload venueId={venueId} slug={slug} signedIn={signedIn} />
      </details>

      {!claimed && (
      <details id="claim" className="mt-2 text-xs text-ink/55" open={msg?.startsWith("claim")}>
        <summary className="cursor-pointer underline">Own or manage this venue? Claim this listing</summary>
        {ok("claim-ok") ? <p className="mt-3 text-sm">Thanks. We&apos;ll verify and get back to you by email.</p> : (
          <form action={submitClaim} className="mt-4 grid gap-3">
            {hidden}
            <p className="text-sm text-ink/70">Claiming is free. You can correct details, reply to reviews and add offers. Reviews stay.</p>
            <input name="business_email" type="email" required placeholder="Work email at the venue (e.g. info@venue.ae)" className={field} />
            <input name="role" placeholder="Your role (owner, manager, marketing)" className={field} />
            <textarea name="evidence" rows={2} placeholder="Anything that helps us verify (trade licence number, website admin, etc.)" className={field} />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="photo_consent" defaultChecked className="mt-1" /> Ziggadoo may use official photos from our website and social media on this listing. We own or hold the rights to these images.</label>
            <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">Claim venue</button>
          </form>
        )}
      </details>
      )}
    </section>
  );
}
