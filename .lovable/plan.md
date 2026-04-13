

# Review & Refinement: Shuttle Pickup Flow

## Issues Found

### 1. Inefficient Query — Fetches ALL pickup points
In `Shuttle.tsx` line 122, the rayons query fetches **all** active pickup points globally, then filters client-side. With many routes and points, this wastes bandwidth.

**Fix**: Filter pickup points by the rayon IDs returned in the same query.

### 2. Distance "0m" display is confusing
In `PickupSelector.tsx`, points with `distance_meters: 0` show "0m" which looks broken. The first stop in each rayon always has 0 distance.

**Fix**: Hide distance display when `distance_meters === 0`.

### 3. Missing departure_time display
Hermes route pickup points have `departure_time: null`. The UI shows empty string before "WIB" label, resulting in " WIB" with no time.

**Fix**: Only show departure_time line if it exists, and hide "WIB" suffix when no time.

### 4. Step indicator missing
Users have no visual progress indicator showing where they are in the 10-step flow.

**Fix**: Add a compact step progress bar below the header.

---

## Changes

### `src/pages/Shuttle.tsx`
- Optimize rayons query: pass rayon IDs to filter pickup points server-side using `.in("rayon_id", rayonIds)`
- Add a step progress indicator component showing current step (1-10)

### `src/components/shuttle/PickupSelector.tsx`
- Hide distance when `distance_meters === 0`
- Only show departure_time text when it has a value
- Improve empty-time fallback display

No database changes required.

| File | Change |
|------|--------|
| `src/pages/Shuttle.tsx` | Optimize pickup query, add step indicator |
| `src/components/shuttle/PickupSelector.tsx` | Fix distance/time display edge cases |

