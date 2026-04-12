

# Ride Service Types + Hotel Booking Feature

## Part 1: Ride Service Types (Bike, Bike Women, Cars)

### Flow
Pick-up → Drop-off → **Service selection step** (new) → Fare calculation → Request ride

### Database Changes

1. **Add `service_type` column to `rides` table**
   - New enum `ride_service_type`: `bike`, `bike_women`, `car`
   - Default: `car`

2. **No new tables needed** — service type is a property of each ride

### Fare Calculation Update (`calculate-fare` edge function)
- Accept `service_type` parameter
- Different pricing per service:
  - **Bike**: Base Rp 5,000 + Rp 1,800/km (cheapest)
  - **Bike Women**: Base Rp 5,500 + Rp 2,000/km (women-only drivers)
  - **Car**: Base Rp 7,000 + Rp 2,500/km (current pricing)

### Frontend Changes

1. **`rideStore.ts`** — Add `serviceType` state (`bike | bike_women | car`)

2. **`Ride.tsx`** — New flow:
   - After both pickup + dropoff are set, show **service selection panel** (not fare yet)
   - Service cards with icons (motorcycle icon for Bike/Bike Women, car icon for Cars), name, and estimated price
   - Selecting a service triggers fare calculation with `service_type` param
   - Then shows the existing confirmation panel

3. **New component `src/components/ride/ServiceSelector.tsx`**
   - Three cards: Bike (motorcycle icon, green), Bike Women (motorcycle + shield icon, pink), Cars (car icon, blue)
   - Each shows estimated fare range
   - Tapping one selects and proceeds to confirmation

### Admin Integration
- `AdminRides.tsx` — Show service type column in the rides table
- Filter rides by service type

---

## Part 2: Hotel Booking Feature (Traveloka-style)

### Database Tables (new migration)

1. **`hotels`** — Hotel listings
   - `id`, `name`, `description`, `address`, `city`, `lat`, `lng`, `rating` (numeric), `star_rating` (int 1-5), `image_url`, `amenities` (text[]), `active` (boolean), `created_at`, `updated_at`
   - RLS: public read, admin write

2. **`hotel_rooms`** — Room types per hotel
   - `id`, `hotel_id` (references hotels), `name` (e.g. "Deluxe", "Superior"), `description`, `price_per_night` (numeric), `max_guests` (int), `image_url`, `amenities` (text[]), `total_rooms` (int), `available_rooms` (int), `active`, `created_at`, `updated_at`
   - RLS: public read, admin write

3. **`hotel_bookings`** — User bookings
   - `id`, `user_id` (uuid), `hotel_id`, `room_id`, `check_in` (date), `check_out` (date), `guests` (int), `total_price` (numeric), `status` (enum: `pending`, `confirmed`, `cancelled`, `completed`), `booking_ref` (text, auto-generated), `guest_name`, `guest_phone`, `special_requests` (text), `created_at`, `updated_at`
   - RLS: users can view/create own bookings, admins can manage all

### Frontend Pages

1. **`src/pages/Hotel.tsx`** — Hotel listing page (Traveloka-style)
   - Search bar with city/destination, check-in/out date pickers, guest count
   - Hotel cards: image, name, star rating, price from, location
   - Sort by price/rating
   - Filter by star rating, price range

2. **`src/pages/HotelDetail.tsx`** — Hotel detail page
   - Hero image, hotel info, amenities chips
   - Room list: room cards with photo, name, price, max guests, book button
   - Map showing hotel location

3. **`src/components/hotel/HotelSearchBar.tsx`** — Search/filter component
4. **`src/components/hotel/HotelCard.tsx`** — Hotel list item card
5. **`src/components/hotel/RoomCard.tsx`** — Room card with booking action
6. **`src/components/hotel/BookingDialog.tsx`** — Booking confirmation modal (guest info, dates, pay via wallet)

7. **`src/pages/HotelBookings.tsx`** — User's hotel booking history

### Admin Dashboard Integration

1. **`src/pages/admin/AdminHotels.tsx`** — Hotel & room management
   - CRUD hotels (name, address, images, amenities, star rating)
   - CRUD rooms per hotel (name, price, capacity)
   - View all bookings with status management

2. **Add "Hotels" nav item** to `AdminLayout.tsx` (Building icon)

### Routing
- `/hotel` — Hotel listing
- `/hotel/:id` — Hotel detail
- `/hotel/bookings` — User booking history
- `/admin/hotels` — Admin hotel management

### Home Page Update
- Add "Hotel" service card on Index.tsx (Building icon, alongside Ride and Shuttle)

### Bottom Nav Update
- Add Hotel icon to bottom nav (between Shuttle and Wallet)

---

## Implementation Order

1. Migration: add `ride_service_type` enum + column to `rides`, create hotel tables
2. Update `calculate-fare` edge function with service type pricing
3. Build ride service selector UI + update ride flow
4. Build hotel listing, detail, and booking pages
5. Build admin hotel management page
6. Update navigation (bottom nav, admin sidebar, home page)

