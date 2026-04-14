# Shuttle System - End-to-End Testing Guide

**Last Updated:** April 14, 2026  
**Test Version:** v1.0  
**Environment:** Staging & Production Ready

---

## TABLE OF CONTENTS

1. [Test Environment Setup](#test-environment-setup)
2. [User Booking Flow Tests](#user-booking-flow-tests)
3. [Admin Management Tests](#admin-management-tests)
4. [Security & Fraud Tests](#security--fraud-tests)
5. [Performance Tests](#performance-tests)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## TEST ENVIRONMENT SETUP

### Prerequisites
- [ ] Supabase project configured (staging)
- [ ] Database migrations deployed
- [ ] Test data seeded (routes, schedules, services, pricing)
- [ ] Frontend deployed to staging URL
- [ ] Admin user account created
- [ ] Regular user account created
- [ ] Test user account(s) prepared

### Database Test Data
```sql
-- Verify test data exists:
SELECT COUNT(*) FROM shuttle_routes WHERE active=true;  -- Should be >= 3
SELECT COUNT(*) FROM shuttle_schedules WHERE active=true;  -- Should be >= 5
SELECT COUNT(*) FROM shuttle_service_types;  -- Should be 3
SELECT COUNT(*) FROM shuttle_service_vehicle_types;  -- Should be 3
SELECT COUNT(*) FROM shuttle_pricing_rules;  -- Should be 3
SELECT COUNT(*) FROM shuttle_schedule_services;  -- Should be > 9
```

---

## USER BOOKING FLOW TESTS

### Test 1: Route Selection
**Objective:** Verify route selection displays all active routes

**Steps:**
1. Navigate to `/shuttle` (user page)
2. Click "Book Shuttle" tab
3. Verify route list displays

**Expected Results:**
- [ ] At least 3 routes visible
- [ ] Routes show "origin → destination"
- [ ] Route names displayed correctly
- [ ] No error messages
- [ ] "Next" button disabled until selection

**Test Data:**
- Regular routes with known origins/destinations

---

### Test 2: Schedule Selection
**Objective:** Verify schedules filter by selected route and show correct times

**Steps:**
1. Select a route (e.g., Bandung → Jakarta)
2. Verify schedule list loads
3. Check departure/arrival times

**Expected Results:**
- [ ] Only schedules for selected route visible
- [ ] Multiple departure times shown (7:00, 10:00, 14:00, etc.)
- [ ] Times sorted chronologically
- [ ] Dates formatted correctly (Indonesian locale)
- [ ] "Next" button disabled until selection

**Verify:**
```
Route: Bandung → Jakarta
Schedules visible:
- 07:00 — 12:00 (5h)
- 10:00 — 15:00 (5h)
- 14:00 — 19:00 (5h)
- 18:00 — 23:00 (5h)
```

---

### Test 3: Service & Vehicle Selection
**Objective:** Verify all 3 services displayed with correct pricing

**Steps:**
1. Select a route
2. Select a schedule
3. Verify service options appear

**Expected Results:**
- [ ] Exactly 3 service options displayed
- [ ] Each shows:
  - [ ] Service name (Regular, Semi Exec, Executive)
  - [ ] Vehicle type (MiniCar, SUV, Hiace)
  - [ ] Capacity (4, 7, 10 seats)
  - [ ] Facilities list (AC, WiFi, Premium, Toilet)
  - [ ] Available seats count
  - [ ] Starting price (Rp format with thousands separator)
- [ ] One option pre-selected (featured)
- [ ] Prices differ between options
- [ ] Info box explains pricing includes distance & surcharges

**Verify Pricing Accuracy:**
```
Route: Bandung → Jakarta (50km)
Schedule: 14:00 departure
Rayon: Downtown Area (Rp 5,000 surcharge)

Regular (1.0x):
  Base: 150,000
  Distance (50km × 2,000): 100,000
  Rayon: 5,000
  Total: ~255,000 ✓

Semi Exec (1.2x):
  Base: 180,000
  Distance (50km × 3,000): 150,000
  Rayon: 5,000
  Total: ~335,000 ✓

Executive (1.5x):
  Base: 225,000
  Distance (50km × 5,000): 250,000
  Rayon: 5,000
  Total: ~480,000 ✓
```

**Price Change Test:**
- [ ] Change selection to different service
- [ ] Price sidebar updates immediately
- [ ] Breakdown updates in real-time

---

### Test 4: Pickup Location Selection
**Objective:** Verify rayon/pickup zones display correctly

**Steps:**
1. Complete route → schedule → service
2. Proceed to pickup step
3. Verify rayon list loads

**Expected Results:**
- [ ] Rayon list displays (Downtown, Airport, Suburbs, etc.)
- [ ] Multiple zones available
- [ ] Pickup points shown under each rayon
- [ ] Search filter works (if available)
- [ ] "Next" button disabled until selection

**Test Data:**
- 5+ rayon zones with multiple pickup points each

---

### Test 5: Seat Selection
**Objective:** Verify seat picker shows availability correctly

**Steps:**
1. Complete route → schedule → service → rayon
2. Proceed to seat selection
3. Verify seat layout displays

**Expected Results:**
- [ ] Seat grid displays (e.g., 4x2 for 10-seat Hiace)
- [ ] Empty seats shown as clickable
- [ ] Already booked seats shown as disabled
- [ ] Selected seats highlighted
- [ ] Seat count updates as selection changes
- [ ] Price updates based on seat count

**Multiple Selection Scenarios:**
1. **Single seat:**
   - [ ] Can select 1 seat
   - [ ] Price shows 1x multiplier for surcharge

2. **Multiple seats:**
   - [ ] Can select 2-4 seats
   - [ ] Non-contiguous seats allowed
   - [ ] Price multiplies surcharge (seats × base_rayon_surcharge)

3. **Full vehicle:**
   - [ ] Can select all available seats
   - [ ] "Next" enabled for all scenarios

**Edge Cases:**
- [ ] Cannot select already booked seats
- [ ] Deselecting seat removes from total
- [ ] Seat count persists if going back/forward

---

### Test 6: Passenger Information
**Objective:** Verify passenger form validation

**Steps:**
1. Select seats (e.g., 2 or 3)
2. Proceed to passenger info step
3. Fill in passenger details

**Expected Results:**
- [ ] Form appears for each selected seat
- [ ] Each form shows seat number
- [ ] Name field required (validation)
- [ ] Phone field required (validation)
- [ ] Phone accepts Indonesian format (+62 or 08...)
- [ ] Can edit previous passengers if going back

**Validation Tests:**
1. **Empty fields:**
   - [ ] "Next" button disabled if any field empty
   - [ ] Error message shown (if applicable)

2. **Valid data:**
   ```
   Seat 1: Budi Santoso, 081234567890
   Seat 2: Siti Nurhaliza, +62812345678
   ```
   - [ ] "Next" enabled after all filled

3. **Invalid phone:**
   - [ ] Reject if format invalid
   - [ ] Show error guidance

---

### Test 7: Summary & Review
**Objective:** Verify all booking details displayed correctly

**Steps:**
1. Complete all previous steps
2. Reach summary step
3. Verify all information

**Expected Results:**
- [ ] Route displayed (Origin → Destination)
- [ ] Departure & arrival times correct
- [ ] Service type, vehicle, capacity shown
- [ ] Passenger list with names & phones
- [ ] Pickup location (rayon) displayed
- [ ] Seat count shown (e.g., "2 seats reserved")
- [ ] Price breakdown visible:
  - [ ] Base Fare: Shown
  - [ ] Service Premium: Shown
  - [ ] Distance Charge: Shown
  - [ ] Rayon Surcharge: Shown
  - [ ] TOTAL: Prominently displayed
- [ ] Important info box visible (10-min lock, ID requirement, arrival time)
- [ ] Amenities listed (AC, WiFi, etc.)

**Verify Correctness:**
- All data matches user selections
- No typos or formatting errors
- Prices match previous calculations (within 1 Rp tolerance)

---

### Test 8: Payment Method Selection
**Objective:** Verify payment options available

**Steps:**
1. Review summary
2. Proceed to payment step
3. Select payment method

**Expected Results:**
- [ ] At least 2 payment options shown:
  - [ ] Cash (CASH)
  - [ ] Card (CARD)
  - [ ] Bank Transfer (TRANSFER - if available)
- [ ] One option pre-selected
- [ ] Display description for each method
- [ ] "Confirm & Pay" button enabled

**Payment Method Tests:**
1. **Cash payment:**
   - [ ] Selectable
   - [ ] Shows payment details (where to pay)

2. **Card payment:**
   - [ ] Selectable
   - [ ] Shows card acceptance info

3. **Bank Transfer:**
   - [ ] Selectable (if active)
   - [ ] Shows bank account details

---

### Test 9: Booking Confirmation
**Objective:** Verify booking created and confirmation shown

**Steps:**
1. Select payment method
2. Click "Confirm & Pay"
3. Wait for confirmation

**Expected Results:**
- [ ] Booking created successfully
- [ ] Unique reference number generated (format: BDG-YYYY-MM-DD-XXXXX)
- [ ] Reference number displayed prominently
- [ ] Booking ticket/confirmation shown
- [ ] Confirmation email sent (verify in test email service)
- [ ] "My Bookings" tab shows new booking

**Verify Data:**
```
Reference: BDG-2026-04-14-12345
Status: CONFIRMED
Date: 14 April 2026
Departure: 14:00
Passengers: Budi Santoso, Siti Nurhaliza
Service: Regular (MiniCar, 4 seats)
Total: Rp 510,000
```

---

### Test 10: Booking History
**Objective:** Verify user can view his bookings

**Steps:**
1. Create a booking (Test 9)
2. Click "My Bookings" tab
3. Verify booking appears

**Expected Results:**
- [ ] New booking visible in list
- [ ] Reference number shown
- [ ] Route displayed
- [ ] Booking date/time shown
- [ ] Status shown (CONFIRMED, PENDING, COMPLETED, CANCELLED)
- [ ] Can click to view full details
- [ ] Can cancel booking (if status allows)

---

## ADMIN MANAGEMENT TESTS

### Test 11: Service Types Management
**Objective:** Verify admin can manage service-vehicle mappings

**Steps:**
1. Log in as admin
2. Navigate to `/admin/shuttles`
3. Click "Services" tab
4. Verify service list loads

**Expected Results:**
- [ ] All 3 service mappings visible:
  - [ ] Regular ↔ MiniCar (4 seats)
  - [ ] Semi Exec ↔ SUV (7 seats)
  - [ ] Executive ↔ Hiace (10 seats)
- [ ] Table shows service name, vehicle, capacity, facilities
- [ ] Active/Inactive badges visible
- [ ] Add, Edit, Delete buttons present

**Add New Mapping Test:**
1. Click "+ Add Service-Vehicle Mapping"
2. Fill form:
   - Service Type: Select "Regular"
   - Vehicle Type: "economy"
   - Vehicle Name: "Economy Car"
   - Capacity: 3
   - Facilities: "AC, Basic Comfort"
3. Click "Add Mapping"

**Expected Results:**
- [ ] Modal closes
- [ ] New mapping appears in table
- [ ] Toast notification: "Service-Vehicle mapping added"
- [ ] Can see immediately in list

**Edit Mapping Test:**
1. Click Edit on existing mapping
2. Change capacity: 5 seats
3. Add facility: "WiFi"
4. Click "Update Mapping"

**Expected Results:**
- [ ] Modal closes
- [ ] Updated data in table
- [ ] Toast notification: "Service-Vehicle mapping updated"
- [ ] Change visible immediately

**Delete Mapping Test:**
1. Click Delete on a mapping
2. Confirm deletion

**Expected Results:**
- [ ] Mapping removed from table
- [ ] Toast notification: "Service-Vehicle mapping deleted"
- [ ] Cannot see deleted mapping in list

---

### Test 12: Pricing Rules Management
**Objective:** Verify admin can configure pricing

**Steps:**
1. Click "Pricing" tab in admin
2. Verify pricing rules visible

**Expected Results:**
- [ ] All 3 pricing rules visible:
  - [ ] Regular: 1.0x, Rp2,000/km, 1.0x peak, Rp5,000 rayon
  - [ ] Semi Exec: 1.2x, Rp3,000/km, 1.2x peak, Rp7,500 rayon
  - [ ] Executive: 1.5x, Rp5,000/km, 1.2x peak, Rp10,000 rayon
- [ ] Table formatted clearly with Rp and multiplier display
- [ ] Add, Edit, Delete buttons available

**Add New Pricing Rule Test:**
1. Click "+ Add Pricing Rule"
2. Fill form:
   - Service Type: Select "Regular"
   - Base Multiplier: 1.1
   - Cost/Km: 2500
   - Peak Multiplier: 1.1
   - Rayon Surcharge: 6000
3. Click "Add Rule"

**Expected Results:**
- [ ] New rule appears in table
- [ ] Toast: "Pricing rule added"
- [ ] Formatting correct (1.1x, Rp 2.500, etc.)

**Edit Pricing Test:**
1. Click Edit on "Regular" pricing
2. Change Base Multiplier: 1.05
3. Change Cost/Km: 2200
4. Click "Update Rule"

**Expected Results:**
- [ ] Updated values in table
- [ ] Toast: "Pricing rule updated"
- [ ] Change immediate

**Price Impact Test:**
1. Edit Regular pricing to new values
2. Create new booking with Regular service
3. Verify price uses new multipliers

---

## SECURITY & FRAUD TESTS

### Test 13: Price Verification
**Objective:** Verify server rejects fraudulent pricing

**Steps:**
1. Start booking flow
2. "Intercept" price in browser dev tools
3. Modify claimed price higher
4. Attempt to complete booking

**Expected Results:**
- [ ] Booking rejected OR
- [ ] Price recalculated server-side OR
- [ ] Error message shown: "Price verification failed"
- [ ] Booking NOT created with fake price

**Test Scenarios:**
1. **Price too high (+50%):** Rejected ✓
2. **Price too low (-50%):** Rejected ✓
3. **Price within 1 Rp tolerance:** Accepted ✓
4. **Price exact match:** Accepted ✓

---

### Test 14: Seat Availability Lock
**Objective:** Verify seats are properly locked during booking

**Steps:**
1. User A starts booking, selects 2 seats
2. User B simultaneously books same schedule
3. Verify User B cannot select same seats

**Expected Results:**
- [ ] User A's seats show as "locked" to User B
- [ ] User B can only select unbooked seats
- [ ] When User A cancels, seats become available
- [ ] No double-booking occurs

---

### Test 15: Row-Level Security (RLS)
**Objective:** Verify database security policies enforced

**Steps:**
1. Log in as regular user
2. Attempt to directly query admin-only data via GraphQL/API
3. Log in as admin
4. Same query should succeed

**Expected Results:**
- [ ] Regular user: Query denied (401/403)
- [ ] Admin user: Query allowed
- [ ] RLS policies enforced at database level

**Test Data Access:**
1. Regular user accessing own bookings: ✓ Allowed
2. Regular user accessing another user's bookings: ✗ Denied
3. Regular user accessing pricing rules edit: ✗ Denied
4. Admin accessing all data: ✓ Allowed

---

### Test 16: Authentication Check
**Objective:** Verify only authenticated users can book

**Steps:**
1. Log out completely
2. Navigate to `/shuttle`
3. Attempt to proceed through booking flow

**Expected Results:**
- [ ] Can view routes/schedules (public)
- [ ] When selecting service, prompted to log in
- [ ] Redirected to `/auth` login page
- [ ] After login, can complete booking

---

## PERFORMANCE TESTS

### Test 17: Load Times
**Objective:** Verify acceptable performance

**Measurements:**
- [ ] Route list loads: < 1 second
- [ ] Schedule list loads: < 1 second
- [ ] Service selector loads: < 1 second
- [ ] Price calculation updates: < 100ms
- [ ] Booking creation: < 2 seconds

**Test with DevTools (Network tab):**
1. Open `/shuttle`
2. Measure Time to First Byte (TTFB)
3. Measure First Contentful Paint (FCP)
4. Measure Largest Contentful Paint (LCP)

**Expected Results:**
- [ ] TTFB: < 500ms
- [ ] FCP: < 1s
- [ ] LCP: < 2.5s

---

### Test 18: Concurrent Bookings
**Objective:** Verify system handles multiple simultaneous bookings

**Test Scenario:**
1. 5 users simultaneously book same schedule/service
2. Monitor database load & response times
3. Verify all bookings created correctly

**Expected Results:**
- [ ] All 5 bookings succeed
- [ ] Seat counts accurate
- [ ] Price calculations correct
- [ ] No errors or conflicts
- [ ] Response time still < 3s per booking

---

### Test 19: Mobile Responsiveness
**Objective:** Verify UI works on mobile devices

**Test Devices:**
- [ ] iPhone 12 (375px width)
- [ ] Android (360px width)
- [ ] iPad (768px width)
- [ ] Desktop (1920px width)

**Check on Each:**
- [ ] All buttons clickable
- [ ] Forms readable & usable
- [ ] Price sidebar visible
- [ ] Table scrollable (admin)
- [ ] No horizontal scroll needed
- [ ] Touch targets > 44px

---

## EDGE CASES & ERROR HANDLING

### Test 20: Invalid User Input
**Objective:** Verify proper error handling

**Test Cases:**

1. **Passenger Name:**
   - [ ] Empty: Show error
   - [ ] Very long (500 chars): Truncate or error
   - [ ] Special characters: Accept or sanitize

2. **Passenger Phone:**
   - [ ] Empty: Show error
   - [ ] Invalid format: Show guidance
   - [ ] Non-numeric: Reject
   - [ ] Valid formats accepted:
     - [ ] +6281234567890
     - [ ] 081234567890
     - [ ] 08-1234-567890

---

### Test 21: Network Errors
**Objective:** Verify graceful error handling

**Simulate Failures:**
1. Disable internet mid-booking
2. Throttle network to very slow
3. Stop backend service

**Expected Results:**
- [ ] Clear error messages shown
- [ ] User can retry
- [ ] Booking state preserved (if possible)
- [ ] No silent failures

---

### Test 22: Database Errors
**Objective:** Verify system handles DB issues

**Simulate Failures:**
1. Stop Supabase temporarily
2. Attempt booking

**Expected Results:**
- [ ] User sees: "Unable to connect. Please try again."
- [ ] No "500 Server Error" dumps console errors
- [ ] Can retry after service restored

---

### Test 23: Concurrent Edit Conflicts
**Objective:** Verify handling of conflicting admin edits

**Simulate:**
1. Admin A edits pricing rule (change multiplier)
2. Admin B edits same rule simultaneously
3. Both attempt to save

**Expected Results:**
- [ ] Last write wins OR
- [ ] Conflict notification shown
- [ ] Data consistent (no corrupted values)
- [ ] No silent overwrites

---

### Test 24: Past Bookings
**Objective:** Verify old schedules don't appear

**Scenario:**
1. Current time: 2026-04-14 15:00
2. Routes with departures before 15:00 should NOT appear
3. Routes with departures after 15:00 should appear

**Expected Results:**
- [ ] Old schedules filtered out
- [ ] Only future schedules visible
- [ ] No "already departed" bookings allowed

---

### Test 25: Fully Booked Scenarios
**Objective:** Verify behavior when vehicles full

**Scenario:**
1. Schedule has 1 seat left
2. User tries to book 2 seats
3. Already 1 user booking for 1 seat

**Expected Results:**
- [ ] Seat selector shows only 1 available
- [ ] Cannot select 2 seats
- [ ] Clear message: "Only 1 seat available"
- [ ] Can book 1 seat if desired

---

## TEST EXECUTION SUMMARY

### Before Each Test Run:
- [ ] Fresh database (or reset test data)
- [ ] Clear browser cache
- [ ] Use incognito mode if testing session handling
- [ ] Monitor network tab for failed requests
- [ ] Check browser console for errors

### Passing Criteria:
```
Unit Tests (PriceCalculator.test.ts):
  ✓ All 50+ assertions pass
  ✓ No TypeScript errors
  ✓ Test execution < 5 seconds

Integration Tests:
  ✓ All 25 E2E tests pass
  ✓ No security vulnerabilities found
  ✓ Performance targets met
  ✓ Mobile responsive working

Manual Tests:
  ✓ All admin CRUD operations work
  ✓ All user flows complete successfully
  ✓ Error messages clear & helpful
  ✓ No data corruption
```

### Test Results Template:
```
TEST EXECUTION REPORT
Date: 2026-04-14
Environment: Staging
Tester: [Name]

Total Tests: 25
Passed: __
Failed: __
Skipped: __

Critical Issues: __
Major Issues: __
Minor Issues: __

Blockers: __ (before launch?)
Recommendation: [ ] Ready for Production [ ] Needs Fixes
```

---

## DEPLOYMENT READINESS CHECKLIST

After all tests pass:

```
[ ] All unit tests passing
[ ] All integration tests passing
[ ] All manual tests completed
[ ] Security tests passed
[ ] Performance benchmarks met
[ ] Mobile responsive verified
[ ] Error handling works
[ ] Database consistent
[ ] No console errors
[ ] Staff trained on admin panel
[ ] Support documentation ready
[ ] Monitoring configured
[ ] Backup tested
[ ] Rollback plan documented

✅ READY FOR PRODUCTION DEPLOYMENT
```

---

*Testing Guide Version: 1.0*  
*Last Updated: April 14, 2026*
