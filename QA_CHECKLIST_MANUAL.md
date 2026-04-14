# Shuttle System - Manual QA Checklist

**Quick Reference for Manual Testing**

---

## QUICK START QA (30 minutes)

### Setup (5 min)
- [ ] Open browser DevTools (F12)
- [ ] Open Network tab (to monitor API calls)
- [ ] Go to staging URL: `/shuttle`
- [ ] Have test user account ready
- [ ] Have admin account ready

### User Flow (15 min)
**Test 1-9: Complete one full booking**

1. **Route Selection** ⏱️ 2 min
   - [ ] See at least 3 routes
   - [ ] Click a route
   - [ ] Next button works

2. **Schedule Selection** ⏱️ 2 min
   - [ ] See multiple departure times
   - [ ] Times sorted correctly
   - [ ] Click a schedule
   - [ ] Next button works

3. **Service Selection** ⏱️ 1 min
   - [ ] See 3 services (Regular, Semi Exec, Executive)
   - [ ] Prices different (each higher than previous)
   - [ ] Can click each to see price update on sidebar
   - [ ] Select Regular service

4. **Pickup Selection** ⏱️ 1 min
   - [ ] See rayon zones (5+)
   - [ ] Click a zone
   - [ ] Pickup points shown
   - [ ] Next button works

5. **Seat Selection** ⏱️ 2 min
   - [ ] See seat grid matching vehicle (4, 7, or 10 seats)
   - [ ] Click to select 2 seats
   - [ ] Seats highlight when selected
   - [ ] Price updates (shows 2x rayon surcharge)
   - [ ] Next button enabled

6. **Passenger Info** ⏱️ 2 min
   - [ ] See form for each seat (2 forms)
   - [ ] Fill Name: "Test User 1" & Phone: "081234567890"
   - [ ] Fill Name: "Test User 2" & Phone: "081234567891"
   - [ ] Next button works

7. **Summary Review** ⏱️ 2 min
   - [ ] All info correct (route, time, service, seats, passengers, price)
   - [ ] Price breakdown shows 4-5 lines
   - [ ] Total highlighted and correct
   - [ ] Next button works

8. **Payment Method** ⏱️ 1 min
   - [ ] See Cash option
   - [ ] See Card option
   - [ ] Select one
   - [ ] "Confirm & Pay" button enabled

9. **Confirmation** ⏱️ 1 min
   - [ ] See "Booking confirmed" message
   - [ ] Reference number displayed (BDG-2026-04-14-XXXXX format)
   - [ ] Ticket/confirmation shown
   - [ ] Can see in "My Bookings"

### Admin Flow (10 min)
**Test 10-11: Quick admin test**

1. **Log in as Admin** ⏱️ 1 min
   - [ ] Go to `/admin/shuttles`
   - [ ] See 5 tabs: Routes, Rayons, **Services**, **Pricing**, Bookings

2. **Services Tab** ⏱️ 4 min
   - [ ] See 3 mappings in table
   - [ ] Click "Edit" on Regular
   - [ ] Change capacity: 5
   - [ ] Click "Update"
   - [ ] See updated value in table ✓

3. **Pricing Tab** ⏱️ 4 min
   - [ ] See 3 pricing rules
   - [ ] Click "Edit" on Regular
   - [ ] Change Base Multiplier: 1.05
   - [ ] Click "Update"
   - [ ] See updated value in table ✓

4. **Verify Impact** ⏱️ 1 min
   - [ ] Go back to `/shuttle`
   - [ ] Create new booking with Regular service
   - [ ] Price should use new multiplier (1.05x)

---

## DETAILED MANUAL QA CHECKLIST

### 🟢 GREEN PATH TESTS (Happy Path)

#### Route Management
- [ ] Lists 3+ routes
- [ ] Shows "Origin → Destination"
- [ ] Can select any route
- [ ] Proceeds to schedule step

#### Schedule Management
- [ ] Shows 5+ scheduled times per day
- [ ] Times sorted (earliest first)
- [ ] Departure and arrival times different
- [ ] Can select any schedule
- [ ] Proceeds to service step

#### Service Selection
- [ ] Exactly 3 options shown
- [ ] Names correct: Regular, Semi Exec, Executive
- [ ] Vehicles correct: MiniCar, SUV, Hiace (or configured values)
- [ ] Capacity shown: 4, 7, 10 (or configured values)
- [ ] Facilities list shown (AC, WiFi, Premium, Toilet)
- [ ] Prices ascending (Regular < Semi < Executive)
- [ ] Featured badge on one option
- [ ] Sidebar shows selected price
- [ ] Sidebar updates when changing selection
- [ ] Can select any option

#### Pickup Management
- [ ] Rayon zones listed (5+)
- [ ] Zone names clear
- [ ] Pickup points shown under each zone
- [ ] Can select any zone
- [ ] Proceeds to seat step

#### Seat Selection
- [ ] Grid matches vehicle type:
  - [ ] 4-seat vehicle: 2x2 grid
  - [ ] 7-seat vehicle: 3x2 or 2x3 grid
  - [ ] 10-seat vehicle: 5x2 grid
- [ ] Empty seats clickable (white/light)
- [ ] Booked seats disabled (gray)
- [ ] Selected seats highlighted (colored)
- [ ] Can select/deselect seats
- [ ] Price updates based on seat count
- [ ] Can select 1-N seats (all available)
- [ ] Proceeds to passenger step

#### Passenger Information
- [ ] Form appears for each selected seat
- [ ] Seat number shown on each form
- [ ] Name field present (text input)
- [ ] Phone field present (tel input)
- [ ] Can fill in all fields
- [ ] Phone field accepts multiple formats:
  - [ ] 081234567890 (standard)
  - [ ] +6281234567890 (international)
- [ ] Proceeds to summary step

#### Summary Review
- [ ] Route: Origin → Destination displayed
- [ ] Date: Formatted (Indonesian locale)
- [ ] Departure time: Shown
- [ ] Arrival time: Shown
- [ ] Service type: Name displayed
- [ ] Vehicle: Name & capacity shown
- [ ] Amenities: Listed with checkmarks
- [ ] Pickup: Zone name shown
- [ ] Passengers: Names & phones listed
- [ ] Seat count: Shown
- [ ] Price breakdown: 4-5 items shown (base, premium, distance, surcharge, total)
- [ ] Total: Highlighted, correct amount
- [ ] Info box: Shows 3 messages (booking lock, ID, arrival time)
- [ ] Proceeds to payment step

#### Payment Selection
- [ ] Cash option shown
- [ ] Card option shown
- [ ] Bank transfer option (if available)
- [ ] One option pre-selected
- [ ] Description for each method
- [ ] Can select different options
- [ ] "Confirm & Pay" button works

#### Booking Confirmation
- [ ] "Booking confirmed" message
- [ ] Reference number shown (format: BDG-YYYY-MM-DD-XXXXX)
- [ ] Ticket/confirmation displayed
- [ ] Can see ticket details:
  - [ ] Reference
  - [ ] Route
  - [ ] Date & Time
  - [ ] Passengers
  - [ ] Service type
  - [ ] Total amount
- [ ] New booking appears in "My Bookings" tab

#### Booking History
- [ ] "My Bookings" tab shows new booking
- [ ] Reference number matches
- [ ] Route displayed
- [ ] Status shown (CONFIRMED)
- [ ] Can click to view more details

---

### 🔴 RED PATH TESTS (Error Cases)

#### Authentication
- [ ] Must be logged in to book
- [ ] Logged-out user redirected to login
- [ ] After login, can continue booking

#### Input Validation
- [ ] Passenger name required (error if empty)
- [ ] Passenger phone required (error if empty)
- [ ] Invalid phone format rejected (if validation)
- [ ] Clear error messages shown

#### Booking Conflicts
- [ ] Cannot select already-booked seats
- [ ] Cannot double-book
- [ ] Error message clear if seat becomes unavailable

#### Service Errors
- [ ] Graceful handling if backend down
- [ ] Clear error message shown
- [ ] Can retry after service restored
- [ ] No "500 error" page shown to user

#### Network Errors
- [ ] Graceful handling offline
- [ ] Retry option provided
- [ ] No silent failures

---

### ⚙️ ADMIN TESTS

#### Services Tab
- [ ] 3 mappings visible in table
- [ ] Columns: Service, Vehicle, Capacity, Facilities, Status, Actions
- [ ] Click "+" button opens Add dialog
- [ ] Add dialog has required fields
- [ ] Can add new mapping
- [ ] Edit button works (populates dialog)
- [ ] Can update existing mapping
- [ ] Delete button works
- [ ] Confirmation dialog on delete
- [ ] Data updates in real-time

#### Pricing Tab
- [ ] 3 rules visible in table
- [ ] Columns: Service, Base, Cost/Km, Peak, Rayon, Status, Actions
- [ ] Numbers formatted correctly (1.2x, Rp 3.000/km)
- [ ] Click "+" button opens Add dialog
- [ ] Add dialog has required fields
- [ ] Can add new rule
- [ ] Edit button works
- [ ] Can update pricing
- [ ] Delete button works
- [ ] Changes apply to new bookings

#### Routes Tab
- [ ] Can add/edit/delete routes (if implemented)
- [ ] CRUD operations work

#### Rayons Tab
- [ ] Can manage rayon zones (if implemented)
- [ ] CRUD operations work

#### Bookings Tab
- [ ] Shows all bookings
- [ ] Filters work (if implemented)
- [ ] Can view booking details
- [ ] Can cancel booking (if permitted)

---

### 📱 MOBILE RESPONSIVENESS

#### Layout
- [ ] No horizontal scroll needed
- [ ] All buttons clickable (44px minimum)
- [ ] Text readable (16px minimum)
- [ ] Forms fill screen width
- [ ] Tables scroll horizontally (if needed)

#### Navigation
- [ ] Back button works
- [ ] Forward button works
- [ ] Tabs switch properly
- [ ] Dialogs display full-screen

#### Tables (Mobile)
- [ ] Important columns visible
- [ ] Can see all data (scroll horizontally if needed)
- [ ] Action buttons accessible

---

### 🔒 SECURITY CHECKS

#### Price Tampering
- [ ] Cannot manually change price in DevTools
- [ ] Server validates and rejects fake price
- [ ] Booking created with correct price (server-calculated)

#### Seat Availability
- [ ] Cannot book already-booked seats
- [ ] Seats locked during transaction
- [ ] No double-booking scenario possible

#### User Isolation
- [ ] Cannot see other users' bookings
- [ ] Cannot access other users' data
- [ ] Can only manage own bookings

#### Admin Access
- [ ] Regular users cannot access admin panel
- [ ] Admin panel requires authentication
- [ ] Non-admin users denied if they somehow access `/admin`

---

### ⚡ PERFORMANCE

#### Load Times
- [ ] Initial page load: < 3 seconds
- [ ] Route list: < 1 second
- [ ] Schedule list: < 1 second
- [ ] Service selector: < 1 second
- [ ] Price updates: < 100ms
- [ ] Booking submission: < 3 seconds

#### Concurrent Users
- [ ] Multiple bookings simultaneously: All succeed
- [ ] No data corruption
- [ ] No conflicts
- [ ] Response times acceptable

---

### 💾 DATA INTEGRITY

#### Seat Management
- [ ] Available seats decrement on booking
- [ ] Available seats increment on cancel
- [ ] Count always accurate
- [ ] No overselling possible

#### Price Calculation
- [ ] All components calculated correctly
- [ ] Total accurate (base + premium + distance + surcharge)
- [ ] Peak hours applied if booking is during peak
- [ ] Rayon surcharge applied correctly

#### Booking Reference
- [ ] Unique per booking
- [ ] Format consistent: BDG-YYYY-MM-DD-XXXXX
- [ ] Always generated
- [ ] Persisted in database

---

### 🎨 UI/UX

#### Clarity
- [ ] All text clear and readable
- [ ] prices clearly displayed (Rp format)
- [ ] Service names unambiguous
- [ ] Vehicle names understandable
- [ ] Icons present where helpful
- [ ] Color coding logical (green=available, gray=booked)

#### Guidance
- [ ] Info boxes explain pricing
- [ ] Error messages helpful
- [ ] Instructions clear
- [ ] Progress bar shows current step
- [ ] "Next" button context clear

#### Feedback
- [ ] Toast notifications on success
- [ ] Toast notifications on error
- [ ] Loading spinners on async operations
- [ ] Button states (enabled/disabled) clear

---

## QUICK ISSUE LOGGING TEMPLATE

When you find an issue:

```
**Title:** [Brief description]

**Severity:** 
- [ ] Critical (blocks usage)
- [ ] Major (significant impact)
- [ ] Minor (cosmetic/optional)

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile]
- URL: [Exact URL where issue occurred]

**Screenshots:**
[If helpful, attach screenshot]
```

---

## TEST EXECUTION LOG

| Date | Tester | Test Suite | Status | Issues Found | Notes |
|------|--------|-----------|--------|-------------|-------|
| 2026-04-14 | [Name] | Green Path | ✓ Pass | 0 | All booking steps working |
| 2026-04-14 | [Name] | Admin Panel | ✓ Pass | 0 | CRUD operations smooth |
| 2026-04-14 | [Name] | Mobile | ✓ Pass | 1 | Minor: Seat grid needs scroll |
| 2026-04-14 | [Name] | Security | ✓ Pass | 0 | Price verification working |

---

## SIGN-OFF

```
Manual QA Completed: [ ] Yes [ ] No
Tester Name: ______________________
Date: ______________________
Issues Found: ______
Critical Issues: ______
Ready for Production: [ ] Yes [ ] No

Comments:
_______________________________________________________
_______________________________________________________
```

---

*Updated: April 14, 2026*
