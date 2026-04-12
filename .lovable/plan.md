

# Add Search-Based Pickup/Dropoff with Address Autocomplete

## Overview
Replace the static text display in the top bar with searchable input fields that use Nominatim forward geocoding for address autocomplete. Users can either type an address to search or tap the map. Both methods show readable addresses.

## Changes

### 1. Fix Build Errors (all 6 edge functions)
Cast `e`/`error` to `Error` type in catch blocks across all 6 edge functions:
- `calculate-fare/index.ts` — `(e as Error).message`
- `create-shuttle-payment/index.ts` — `(error as Error).message`
- `create-topup/index.ts` — `(error as Error).message`
- `dispatch-driver/index.ts` — `(e as Error).message`
- `payment-webhook/index.ts` — `(error as Error).message`
- `process-ride-payment/index.ts` — `(error as Error).message`

### 2. Create `LocationSearchInput` Component
New file: `src/components/ride/LocationSearchInput.tsx`
- Input field with debounced search (300ms)
- Calls Nominatim search API: `https://nominatim.openstreetmap.org/search?q={query}&format=json&countrycodes=id&limit=5`
- Shows dropdown with address suggestions
- On select: sets lat/lng + readable address via callback
- Props: `placeholder`, `value` (address string), `onSelect(lat, lng, address)`, `icon` (colored dot)

### 3. Update `Ride.tsx` Top Bar
Replace the static `<p>` tags with `LocationSearchInput` components:
- Pickup input: green dot, placeholder "Search pick-up location"
- Dropoff input: red dot, placeholder "Search drop-off location"
- Selecting a suggestion sets the pickup/dropoff in the store and moves the map
- Map tap still works as before (existing `handleMapClick` unchanged)
- Add clear buttons (X) to reset individual locations

### Technical Details
- Nominatim API is free, no key needed, already used for reverse geocoding
- Bounded to Indonesia (`countrycodes=id`) and viewport area (`viewbox` param using map bounds)
- Debounce prevents excessive API calls
- Existing reverse geocode on map tap continues to work alongside search

