# Ziggadoo data model (v1)

Plain-English summary of what the database knows and why.

## Core objects

| Table | What it is | Example |
|---|---|---|
| `locations` | A container a venue sits inside. Never an activity itself. | Dubai Mall, Zabeel Park, Kite Beach |
| `venues` | The thing you go to and pay for. This is what search returns. | KidZania, OliOli, Aventura Parks |
| `events` | Time-bound things at a venue. | Saturday pottery workshop at Mini Makers |
| `venue_photos` | Photos, labelled official or community. | |
| `profiles` | A parent, business owner or admin. Auto-created on signup. | |
| `children` | Birthdate only, so ages update themselves. | Storm, 2021-03-14 |
| `reviews` | Rating plus which ages actually loved it. This is where real age-fit data comes from. | |
| `reports` | "This place is closed", "wrong price". Drives freshness. | |
| `edit_suggestions` | Parent-proposed corrections, approved by admin. | |
| `venue_claims` | Business owner claiming their listing. | |

## Decisions worth knowing

**Ages are in months, not years.** 18 months and 2 years are different worlds for a parent. The UI shows years.

**Two sources of age fit.** The venue's own claim (`best_age_min/max`) and the community's (`community_age_min/max`, from reviews). Community data overrides the venue claim once it exists. Until then the venue claim is shown, without the "parents say" label.

**Pricing is structured enough to total it.** `price_model`, child price, adult price, adult free, free under X months. That's what makes "AED 420 for your family" possible on the card.

**Nothing is public until verified.** `status = draft` is the default, including for the AI seed. Only `verified` venues appear in search. `archived` is for confirmed closures, kept internally to stop duplicates.

**Freshness is a real column.** `last_verified_at` feeds directly into ranking: verified in the last 30 days gets a boost, 90 days a smaller one.

**Ranking formula** (in `search_venues`): family fit x3, rating x1.5, freshness up to 1, proximity up to 1, sponsored +0.5. Sponsored gets placement help, never a rating boost.

**Row Level Security is on for every table.** Anonymous users can read verified content. Signed-in parents can only touch their own children, favourites, reviews and reports. Admins (role on profile) can do everything.

**Opening hours are JSON.** Flexible enough for Ramadan/seasonal changes without schema changes. `seasonal_notes` is free text for "outdoor area closed in summer".

**WhatsApp is a first-class field.** Stored in E.164 so the app can deep link.

## Not in v1 on purpose

- Points and validator tier
- Business self-service editing (claim exists, editing comes after)
- Arabic
- Native app tables (push tokens etc.)
