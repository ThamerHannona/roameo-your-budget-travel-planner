## Goal

Expand the flight and hotel pickers on `/trip/:destination/budget` from 3 fixed tiers to full result lists (20-40 options), with client-side sort/filter and real-time budget updates.

## Backend (edge functions)

**`search-flights`**
- Return the full `best_flights` + `other_flights` arrays from SerpAPI (currently trimmed).
- Response payload: `{ ok, options: FlightOption[], searchUrl, totalFound }` — no tier assignment in the function; tiers are derived client-side.
- Keep existing rate limiting and validation.

**`search-hotels`**
- Fetch page 1, then follow `next_page_token` once (cap at ~30 properties) to guarantee a healthy pool.
- Include `distance`, `hotel_class`/stars, `images[]`, and `link` per property.
- Response payload: `{ ok, results: HotelResult[], searchUrl, totalFound, nights }`.

## Client services

- `serpapi.ts` / `hotelApi.ts`: pass through the full list unchanged. Drop the "pick 3 representative" trimming. Keep 1-hour cache keyed by destination + dates + travelers.
- Add a small `deriveFlightTiers(options)` / `deriveHotelTiers(options)` helper used only for the highlight badges (cheapest / best price-duration / premium; 25th percentile 4★ / median 4★ / top-rated).

## New UI components

`src/components/budgetAllocation/FlightPicker.tsx`
- Highlight strip: 3 pinned tier cards ("Best Price", "Recommended", "Premium") — click to select.
- Filter bar: max stops (any / non-stop / ≤1), airline multi-select, departure window (morning/afternoon/evening/red-eye).
- Sort dropdown: price (default) / duration / stops.
- Virtualized scrollable list of flight rows: airline logo, flight numbers, dep→arr times, duration, stops + layover cities, group price, "Book" link.
- Selected row highlighted; clicking any row updates the store.

`src/components/budgetAllocation/HotelPicker.tsx`
- Quick-pick chips: Budget / Comfort / Luxury — scroll to and select matching hotel.
- Filter bar: star class (3/4/5), min rating slider, max price/night slider.
- Sort dropdown: price / rating / best value (rating ÷ price).
- Virtualized card grid: photo, name, stars, rating + reviews, distance, nightly + total price, amenity chips, "Book" link.
- Selected card highlighted; clicking any card updates the store.

Both pickers use `@tanstack/react-virtual` (already indirectly available via shadcn deps; add if missing) for smooth scrolling of long lists.

## Store changes (`budgetConstraintsStore`)

- Extend `constraints.flights` to hold the full options list plus a `selectedId` (currently keyed by price which collides on ties).
- Same for `constraints.hotels` — replace 3-tier array with full list + `selectedId`.
- `setSelectedFlight(id)` / `setSelectedHotel(id)` actions update the store; the existing `selectedTotal` `useMemo` in `RealTimeBudgetAllocation` recomputes automatically → banner and totals update in real time.

## Wiring on `RealTimeBudgetAllocation.tsx`

- Replace `<FlightTierSelector />` with `<FlightPicker />`, `<HotelTierSelector />` with `<HotelPicker />`.
- Loading state: keep the "Searching live flights…" skeleton until results arrive; on error show the existing "Live search failed — showing estimates" chip.
- The `hasLiveFlights` / `hasLiveHotels` banner logic already works — no changes needed.

## Technical details

- Filters/sort are pure client-side transforms over the cached options array — no new network calls.
- Virtualization threshold: render virtualized list when >10 items, plain list otherwise.
- Tier derivation runs once via `useMemo` off the full options list; badges are labels only, not a separate data source.
- Airport-code / accent-normalization fix from the last change stays in place.

## Verification

- Playwright: load `/trip/dubrovnik/budget` (LAX, Jul 29-Aug 11, 2 adults). Confirm >10 flight rows and >15 hotel cards render. Change sort → order updates without new network calls. Click a mid-tier flight and a 5★ hotel → banner total updates.
- Network tab: exactly one `search-flights` and one `search-hotels` call per destination+dates.

## Files

- Edit: `supabase/functions/search-flights/index.ts`, `supabase/functions/search-hotels/index.ts`
- Edit: `src/services/serpapi.ts`, `src/services/hotelApi.ts`, `src/stores/budgetConstraintsStore.ts`, `src/pages/RealTimeBudgetAllocation.tsx`, `src/types/budgetConstraints.ts`
- New: `src/components/budgetAllocation/FlightPicker.tsx`, `src/components/budgetAllocation/HotelPicker.tsx`
- Retire (delete imports/usages, keep files if referenced elsewhere): `FlightTierSelector.tsx`, `HotelTierSelector.tsx`
