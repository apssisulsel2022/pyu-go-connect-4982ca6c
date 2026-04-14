# SHUTTLE SYSTEM - COMPREHENSIVE ANALYSIS & RECOMMENDATIONS

## EXECUTIVE SUMMARY

Current shuttle booking system has solid foundation but needs structural improvements:
- ✅ Basic flow implemented (Route → Schedule → Service → Vehicle → Pickup → Seats → Payment)
- ✅ Admin management (Routes, Rayons, Bookings tabs)
- ❌ **GAPS**: Service types & vehicle types poorly integrated, no rate calculation logic, incomplete rayon linkage
- ✅ Database schema exists but needs optimization

**Recommendation**: Refactor to properly implement 3 service types × 3 vehicle types per schedule with dynamic pricing.

---

## 1. CURRENT ARCHITECTURE ANALYSIS

### 1.1 DATABASE STRUCTURE

#### Tables Created:
```
✅ shuttle_routes (id, name, origin, destination, base_fare, distance_km, active)
✅ shuttle_schedules (id, route_id, departure_time, arrival_time, total_seats, available_seats, driver_id, service_type_id, vehicle_type, active)
✅ shuttle_service_types (id, name, description, baggage_info, active)
✅ shuttle_bookings (id, schedule_id, user_id, seat_number, passenger_name, phone, status, created_at)
✅ shuttle_rayons (id, name, description)
✅ shuttle_pickup_points (id, rayon_id, stop_order, name, departure_time, distance_meters, fare, active)
```

#### Issues:
- ❌ **shuttle_schedules.service_type_id** is FK but schedule should support **MULTIPLE services simultaneously**
  - Current: 1 service per schedule
  - Should be: Each schedule offers all 3 service types available for booking
  
- ❌ **shuttle_schedules.vehicle_type** stored as TEXT, not linked to service type
  - Current: Manual text entry ("SUV", "MiniCar", "Hiace")
  - Should be: Linked to service type, support multiple options per schedule
  
- ❌ No **pricing_rules** table
  - Can't calculate: base_fare + service_premium + distance_multiplier + rayon_override
  
- ❌ **shuttle_pickup_points.rayon_id** not linked to schedules
  - Rayon tied to route, but need to calculate per-rayon fares dynamically

---

### 1.2 PAGES & COMPONENTS

#### User Booking Flow (src/pages/Shuttle.tsx)
```
Route Selection
  ↓
Schedule Selection (from route)
  ↓
Service Type Selection ← ISSUE: Only selects 1 service from dropdown
  ↓
Vehicle Type Selection ← ISSUE: Manual text selection, not linked to service
  ↓
Pickup Point Selection (from rayon)
  ↓
Seat Selection
  ↓
Passenger Info
  ↓
Payment
  ↓
Confirmation
```

**Current Issues:**
- Line 50-100: Multiple loose state variables, no clear data flow
- ServiceTypeSelector shows all service types equally, no vehicle differentiation
- VehicleTypeSelector has hardcoded `vehicleDetails` object (lines 36-39 in Shuttle.tsx)
- Pricing calculation doesn't exist - always uses base_fare

#### Admin Management (src/pages/admin/AdminShuttles.tsx)
```
Routes Tab ← Create/Edit routes
  ↓
Rayons Tab ← Create/Edit rayons with pickup points
  ↓
Bookings Tab ← View all bookings
```

**Current Issues:**
- No tab for service types management
- No tab for vehicle types management
- No pricing rules interface
- Rayon-to-schedule linkage weak
- Can't preview calculated prices

#### Driver Page (src/pages/driver/DriverShuttle.tsx)
```
Available Trips ← Can accept trip
  ↓
My Trips ← Trips driver accepted
  ↓
Trip Details (passengers, schedule, etc)
```

**Status:** ✅ Functional, but limited to trip assignment

---

### 1.3 SELECTOR COMPONENTS

#### RouteSelector (src/components/shuttle/RouteSelector.tsx)
- ✅ Shows routes with origin/destination & available schedules count
- ✅ Shows base_fare

#### ServiceTypeSelector (src/components/shuttle/ServiceTypeSelector.tsx)
- ✅ Displays service types (name, baggage_info, description)
- ❌ Doesn't show associated vehicle types
- ❌ No pricing multiplier display
- ❌ Doesn't validate schedule has this service

#### VehicleTypeSelector
- ❌ Likely shows hardcoded list from Shuttle.tsx (lines 36-39)
- ❌ Not linked to service type
- ❌ No capacity/facilities info from database

#### ScheduleSelector
- ✅ Shows available schedules for route
- ❌ Doesn't show available services/vehicles for schedule

#### PickupSelector
- ✅ Shows pickup points from rayon
- ❌ Fares are hardcoded in shuttle_pickup_points, not recalculated
- ❌ Doesn't account for distance/service premium

---

## 2. REQUIRED IMPROVEMENTS

### 2.1 Database Schema Enhancements

#### A. Create Service-Vehicle Mapping Table
```sql
shuttle_service_vehicle_types (
  id UUID PRIMARY KEY,
  service_type_id UUID → FK to shuttle_service_types,
  vehicle_type TEXT, -- "SUV", "MiniCar", "Hiace"
  vehicle_name TEXT, -- "SUV Premium", "Mini Car", etc
  capacity INTEGER,
  facilities TEXT[], -- ["AC", "Audio", "Charger"]
  price_multiplier DECIMAL, -- 1.0, 1.2, 1.5
  active BOOLEAN
)
```

#### B. Create Rayon Schedule Mapping
```sql
shuttle_rayon_schedules (
  id UUID PRIMARY KEY,
  rayon_id UUID → FK to shuttle_rayons,
  schedule_id UUID → FK to shuttle_schedules,
  pickup_order INTEGER, -- 1st, 2nd, 3rd rayon on route
  start_fare_override DECIMAL, -- Override base calculation
  active BOOLEAN
)
```

#### C. Refactor Pricing Calculation Table
```sql
shuttle_pricing_rules (
  id UUID PRIMARY KEY,
  service_type_id UUID → FK shuttle_service_types,
  base_fare DECIMAL, -- Default multiplier
  distance_multiplier DECIMAL, -- Per KM cost
  rayon_surcharge DECIMAL, -- Optional rayon markup
  peak_hours_multiplier DECIMAL, -- 1.2x during rush hours
  active BOOLEAN
)
```

#### D. Track Booking Pricing Details
```sql
ALTER TABLE shuttle_bookings ADD COLUMNS:
  - service_type_id UUID (which service booked)
  - vehicle_type TEXT (which vehicle booked)
  - base_amount DECIMAL (route fare)
  - service_premium DECIMAL (service type markup)
  - rayon_surcharge DECIMAL (rayon markup)
  - distance_amount DECIMAL (distance-based cost)
  - total_amount DECIMAL (final price)
  - applied_discount DECIMAL (if any)
```

---

### 2.2 UI/UX Flow Improvements

#### A. Clearer Booking Steps
```
CURRENT (9 steps):
  Route → Schedule → Service → Vehicle → Pickup → Seats → Guest → Payment → Confirm

PROPOSED (7 steps, clearer):
  Route → Schedule → RoutePreview (show rayon on map)
    ↓
  ServiceVehicleSelection (show all 3 configs with prices)
    ↓
  PickupRayonSelection (show calculated fare)
    ↓
  SeatSelection
    ↓
  PassengerInfo
    ↓
  PaymentReview (show breakdown)
    ↓
  Confirmation
```

#### B. Service-Vehicle Presentation
**Current:** Two separate selectors
**Proposed:** Single unified selector showing:
```
┌─────────────────────────────────────────┐
│ Select Service & Vehicle Option         │
├─────────────────────────────────────────┤
│ ☐ Standard (Mini Car)                  │
│   Rp 150.000 | 4 seat | AC, Compact    │
├─────────────────────────────────────────┤
│ ☐ Regular (SUV Premium)                │
│   Rp 200.000 | 7 seat | AC, Audio...   │
├─────────────────────────────────────────┤
│ ◐ Executive (Hiace)         ← Selected  │
│   Rp 300.000 | 10 seat | Premium...    │
└─────────────────────────────────────────┘
```

#### C. Price Breakdown Display
**Before Payment:**
```
Base Fare (Route)         Rp 150.000
Service Premium           Rp  50.000
Rayon Surcharge          Rp  10.000
Subtotal                 Rp 210.000
─────────────────────────
TOTAL                    Rp 210.000
```

---

### 2.3 Admin Management Enhancements

#### A. Add "Service & Vehicles" Admin Tab
```
ServiceTypesManagement:
  - Standard Service (Economy, AC, Min baggage)
  - Regular Service (Mid-range, Good AC, Baggage)
  - Executive Service (Premium, Reclining, TV, Baggage)

VehicleTypesManagement:
  - Mini Car (4 seat, Standard vehicles)
  - SUV (7 seat, all services)
  - Hiace (10 seat, all services)

PricingRulesManagement:
  - Base prices per service type
  - Distance multipliers
  - Peak hour multipliers
  - Rayon surcharges
```

#### B. Schedule Management Enhancement
Current: Single service_type_id, single vehicle_type
Proposed: When creating schedule, check-mark which services available:
```
Route: Banda Aceh - Lhokseumawe | Departure: 06:00

Available Services:
  ✅ Standard (Mini Car) - Rp 150.000
  ✅ Regular (SUV) - Rp 200.000
  ✅ Executive (Hiace) - Rp 300.000

Total Seats Per Service:
  • Standard: 4 seat
  • Regular: 7 seat
  • Executive: 10 seat
```

#### C. Rayon Pricing Override
Current: Fixed fares in pickup_points
Proposed: Show calculated + allow override:
```
RAYON A (Hermes Palace):
  Pickup Order: 1st stop (00:15 departure)
  
  Standard Price: Rp 150.000
  ↓ Can override: ☐ Rp 140.000 (volume discount)
  
  Regular Price: Rp 200.000
  ↓ Can override: ☐ Rp 190.000
```

---

## 3. IMPLEMENTATION ROADMAP

### Phase 1: Database Schema (2-3 hours)
- [ ] Create `shuttle_service_vehicle_types` table
- [ ] Create `shuttle_pricing_rules` table
- [ ] Modify `shuttle_bookings` to track pricing details
- [ ] Migrate existing schedule data to new schema
- [ ] Create helper SQL functions for price calculation

### Phase 2: Backend Service Layer (2-3 hours)
- [ ] Create `ShuttleService` with methods:
  - `getAvailableServiceVehicles(schedule_id)` → All 3 options
  - `calculatePrice(route_id, service_id, vehicle_id, rayon_id)` → Returns breakdown
  - `getScheduleWithPrices(route_id, date)` → Pre-calculated
  - `createBookingWithPricing(bookingData)` → Atomic transaction

### Phase 3: User Booking UI (4-5 hours)
- [ ] Refactor Shuttle.tsx to new step flow
- [ ] Create `ServiceVehicleSelector` component (unified)
- [ ] Update `PickupSelector` to show calculated fares
- [ ] Create `PriceBreakdown` component
- [ ] Add `BookingSummary` before payment

### Phase 4: Admin Management UI (3-4 hours)
- [ ] Create "Service Types" admin tab
- [ ] Create "Vehicle Types" admin tab
- [ ] Create "Pricing Rules" admin tab
- [ ] Enhance Schedule editor to support all 3 services
- [ ] Add Rayon pricing override interface

### Phase 5: Integration & Testing (2-3 hours)
- [ ] Test end-to-end booking flow
- [ ] Verify price calculations
- [ ] Test admin management
- [ ] Responsive design check
- [ ] Performance optimization

**Total Effort:** ~16 hours (2 full development days)

---

## 4. DATA MIGRATION STRATEGY

### Current State Issues:
```
Schedule 1:
  - service_type_id: 1 (Standard)
  - vehicle_type: "SUV"
  - Problem: Mismatch! Standard ≠ SUV
  
Schedule 2:
  - service_type_id: 2 (Regular)
  - vehicle_type: "Hiace"
  - Problem: Not all services available?
```

### Migration Plan:
1. Create mapping table (shuttle_service_vehicle_types)
2. For each existing schedule:
   - Assume it offers all 3 services
   - Use vehicle_type to infer which is "default"
   - Create pricing entries for all 3
3. Verify no data loss

---

## 5. EXAMPLE: COMPLETE BOOKING FLOW (After Improvements)

### User Flow:
```
1. SELECT ROUTE
   User picks: Banda Aceh → Lhokseumawe
   
2. SELECT SCHEDULE  
   User picks: 06:00 departure (3-4 hours expected)
   
3. SELECT SERVICE & VEHICLE
   ☐ Standard (Mini Car, 4 seat)
     Price: Rp 150.000 | Facilities: AC, Compact
   ☑ Regular (SUV, 7 seat)
     Price: Rp 200.000 | Facilities: AC, Audio, Charger
   ☐ Executive (Hiace, 10 seat)
     Price: Rp 300.000 | Facilities: TV, Reclining, WiFi, Charger
   
   [Selected: Regular SUV]
   
4. SELECT RAYON (Pickup Location)
   ☑ RAYON A - Hermes Palace
     Pickup: 06:15 | Price: Rp 200.000
   ☐ RAYON B - City Center
     Pickup: 06:30 | Price: Rp 200.000
   ☐ RAYON C - Airport
     Pickup: 06:45 | Price: Rp 210.000 (+surcharge)
   
5. SELECT SEATS
   [Seat Layout showing available seats]
   Selected: A1, A2
   
6. PASSENGER INFO
   Seat A1: Muhammad Ali | 081234567890
   Seat A2: Siti Nurhaliza | 081234567891
   
7. REVIEW & PAYMENT
   ┌─────────────────────────────┐
   │ BOOKING SUMMARY             │
   │                             │
   │ Regular SUV (7 seat)        │
   │ Route: B.Aceh → Lhokseumawe│
   │ Departure: 06:15 (RAYON A) │
   │ Seats: A1, A2              │
   │                             │
   │ Base Fare × 2        Rp 300.000
   │ Service Premium      Rp  50.000
   │ ────────────────────        │
   │ TOTAL                Rp 350.000
   │                             │
   │ [Pay with Cash] [Pay Online]│
   └─────────────────────────────┘
   
8. CONFIRMATION
   ✓ Booking confirmed!
   Reference: BDG-2026-04-14-001
   Tickets: [PDF Download] [Email]
```

### Admin View (New Features):
```
SCHEDULES TAB:
  Route: Banda Aceh → Lhokseumawe
  Time: 06:00
  
  Available Services:
    ✅ Standard: 4 seats | Rp 150.000
    ✅ Regular:  7 seats | Rp 200.000
    ✅ Executive: 10 seats | Rp 300.000
  
  Total Capacity: 21 seats
  Current Bookings: 8 seats (38%)
  
  [Edit] [Delete] [Copy to Tomorrow] [Analytics]
  
PRICING RULES TAB:
  Service Type | Base Fare | Distance | Peak | Rayon
  Standard     | Rp 150k   | Rp 2k/km | 1.2x | 0
  Regular      | Rp 200k   | Rp 3k/km | 1.2x | +Rp 10k
  Executive    | Rp 300k   | Rp 5k/km | 1.2x | +Rp 20k
```

---

## 6. PERFORMANCE CONSIDERATIONS

### Query Optimization:
- ✅ Index on: schedule_id, route_id, service_type_id, vehicle_type
- ✅ Price calculation should be cached/pre-calculated
- ✅ Available seats count updated via trigger

### Caching Strategy:
- Cache service types: 1 day (rarely changes)
- Cache pricing rules: 1 hour (admin might update)
- Cache available schedules: 5 minutes (seats change frequently)
- Cache calculated prices: 5 minutes

---

## 7. VALIDATION & BUSINESS RULES

### Booking Validation:
- ✅ Service/vehicle selected must be available for schedule
- ✅ Seats selected must exist and be unoccupied
- ✅ Rayon pickup must be on the schedule's route
- ✅ Price calculation must match current rules (no stale prices)
- ✅ Passenger info required (name, phone)

### Admin Validation:
- ✅ Each schedule must have ≥1 available service
- ✅ Service-vehicle combo must exist and be active
- ✅ Pricing rules must be consistent (no gaps)
- ✅ Rayons must be linked to at least 1 route

---

## RECOMMENDATION PRIORITY

### 🔴 Critical (Do First):
1. Create robust price calculation system
2. Link services to vehicles properly
3. Track pricing details in bookings

### 🟡 Important (Do Next):
4. Create admin tabs for service/vehicle/pricing management
5. Improve booking UI to show prices clearly
6. Add price breakdown display

### 🟢 Nice-to-Have (Do Later):
7. Analytics dashboard
8. Queue management system
9. Real-time seat availability notifications

---

**Document Version:** 1.0  
**Created:** April 14, 2026  
**Status:** Analysis Complete - Ready for Implementation
