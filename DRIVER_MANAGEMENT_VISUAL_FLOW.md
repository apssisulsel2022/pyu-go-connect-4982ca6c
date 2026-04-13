# PYU-GO Driver Management - Ringkasan Visual Flow

## 1. DRIVER REGISTRATION & ONBOARDING FLOW

```
START
  ↓
┌─────────────────────────────────┐
│ /driver/auth - Registration     │
│ - Email, Password               │
│ - Full Name, Phone              │
│ - License Number                │
└─────────────────────────────────┘
  ↓
Create auth.users (Supabase)
  ↓
Create drivers table record
├─ status: 'offline'
├─ is_verified: false
└─ registration_status: 'pending'
  ↓
Create user_roles record (role: 'moderator')
  ↓
Send Email Verification
  ↓
User Clicks Verification Link
  ↓
┌─────────────────────────────────┐
│ /driver/profile - Setup Profile │
│                                 │
│ Tab 1: Basic Information        │
│ ├─ Personal Data                │
│ ├─ License Details              │
│ └─ Emergency Contact            │
│                                 │
│ Tab 2: Settings                 │
│ ├─ Working Hours                │
│ ├─ Available Days               │
│ ├─ Service Area                 │
│ └─ Preferences                  │
│                                 │
│ Tab 3: Vehicles & Documents     │
│ ├─ Add Vehicles                 │
│ ├─ Upload Documents (KTP,SIM)   │
│ └─ Upload STNK                  │
└─────────────────────────────────┘
  ↓
All Data Saved to Supabase
  ↓
┌─────────────────────────────────┐
│ registration_status: PENDING    │
│ Waiting for Admin Verification  │
└─────────────────────────────────┘
  ↓
┌─────────────────────────────────┐
│ Admin Reviews at /admin/drivers  │
│ - Check All Documents           │
│ - Verify Vehicles               │
│ - Review Info                   │
└─────────────────────────────────┘
  ↓
        ┌─────────────────────┐
        │   Admin Decision    │
        └─────────────────────┘
       /          |           \
      /           |            \
     ✅            ⚠️             ❌
   APPROVE      SUSPEND        REJECT
     |            |              |
     ↓            ↓              ↓
status=      status=      registration_status=
available    offline       rejected
is_verified= (Email       (Email sent)
true         sent)        
                          Driver can
Send Approval  Driver must  resubmit
Email         reapply
                          
Driver can now        
Accept Rides → READY FOR OPERATIONS
```

## 2. DRIVER STATUS LIFECYCLE

```
                    ┌──────────────┐
                    │   OFFLINE    │
                    │  (Initial)   │
                    └──────────────┘
                           ↑
                           │ toggle
                           │ offline
                           │
                    ┌──────────────┐
            ┌──→ → │ AVAILABLE    │ ← ← ─┐
            │      │  (Online)    │      │
            │      └──────────────┘      │
            │            ↓              │
            │      accept ride          │
            │            ↓              │
            │      ┌──────────────┐     │
            └── ── │    BUSY      │ ── ─┘
                   │ (In Transit) │
                   └──────────────┘
                           ↓
                   complete ride
                           ↓
                      earnings +1
                           ↓
                      BACK TO
                      AVAILABLE
                      
Registration Status (separate):
  pending → approved → can accept rides
         ↘ rejected → must correct & resubmit
```

## 3. DAILY DRIVER OPERATIONS FLOW

```
┌───────────────────────────────────────────────────────────────┐
│                      MORNING: DRIVER WAKES UP                  │
└───────────────────────────────────────────────────────────────┘
                          ↓
            Open App → Dashboard (/driver)
                          ↓
                    ┌──────────────┐
                    │ View 4 Cards │
                    ├──────────────┤
                    │ Today Rides  │ (count: 0)
                    │ Today Income │ (Rp 0)
                    │ Avg Rating   │ (5.0)
                    │ Status       │ (offline)
                    └──────────────┘
                          ↓
            Press "Toggle Online" Button
                          ↓
    ┌─────────────────────────────────────────┐
    │ UPDATE drivers.status = 'available'     │
    │ setOnline(true) in driverStore          │
    ├─────────────────────────────────────────┤
    │ START: useDriverLocation()              │
    │ Every 10 sec:                           │
    │ - Get GPS position                      │
    │ - Update drivers.current_lat/lng        │
    └─────────────────────────────────────────┘
                          ↓
    ┌─────────────────────────────────────────┐
    │ START: useIncomingRide() listener       │
    │ Subscribe to realtime:                  │
    │ - Channel: driver-rides-{driverId}     │
    │ - Event: rides.UPDATE                  │
    │ - Filter: driver_id = self, status=    │
    │           'accepted'                    │
    └─────────────────────────────────────────┘
                          ↓
        WAITING FOR INCOMING RIDES...


┌───────────────────────────────────────────────────────────────┐
│         RIDES ARRIVE (Real-time from Supabase)                │
└───────────────────────────────────────────────────────────────┘
                          ↓
            Supabase UPDATE rides
            status: 'accepted'
                          ↓
    ┌─────────────────────────────────────────┐
    │ useIncomingRide() Triggered             │
    ├─────────────────────────────────────────┤
    │ 1. Play Audio Chime (Web Audio API)     │
    │ 2. Browser Notification (if permission) │
    │ 3. In-app Toast Notification            │
    │ 4. setCurrentRideId(ride.id)            │
    │ 5. Auto-navigate to /driver/ride        │
    └─────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │   ACTIVE RIDE PAGE (/driver/ride)│
        ├─────────────────────────────────┤
        │ • Map: Pickup (🟢) → Dropoff (🔴)│
        │ • Passenger Info (name, phone)   │
        │ • Fare: Rp X,XXX                 │
        │ • Status: "Menuju Pickup"        │
        │                                 │
        │ Button: "Mulai Perjalanan"       │
        └─────────────────────────────────┘
                          ↓
        Driver At Pickup Location
                          ↓
            Click "Mulai Perjalanan"
                          ↓
    ┌─────────────────────────────────────────┐
    │ UPDATE rides.status = 'in_progress'     │
    │ UPDATE rides.started_at = now()         │
    │ drivers.status = 'busy'                 │
    └─────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Map Updates:                    │
        │ Status: "Dalam Perjalanan"      │
        │ Real-time location tracking     │
        │ (still every 10 sec)            │
        └─────────────────────────────────┘
                          ↓
        Driver Arrives at Dropoff
                          ↓
            Click "Selesai" Button
                          ↓
    ┌─────────────────────────────────────────┐
    │ Call Edge Function: /complete-ride      │
    ├─────────────────────────────────────────┤
    │ ✓ UPDATE rides.status = 'completed'    │
    │ ✓ UPDATE rides.completed_at = now()    │
    │ ✓ Create ride_earnings record:         │
    │   - gross_fare: Rp X,XXX               │
    │   - commission (if any): Rp Y          │
    │   - net_earnings: Rp Z                 │
    │ ✓ Update drivers.total_earnings += Z   │
    │ ✓ Update drivers.total_rides += 1      │
    │ ✓ Location tracking continues          │
    └─────────────────────────────────────────┘
                          ↓
        Toast Success: "Ride Selesai!"
                          ↓
               Auto-navigate to /driver
                          ↓
        TODAY RIDES: 1 ✓
        TODAY INCOME: Rp Z


┌───────────────────────────────────────────────────────────────┐
│      AFTERNOON/EVENING: END OF DAY REVIEW                      │
└───────────────────────────────────────────────────────────────┘

                    /driver/history
                          ↓
            Shows all completed rides today/this week
            ├─ Passenger name
            ├─ Pickup → Dropoff address
            ├─ Fare & time
            └─ Status badge (completed/cancelled)


                    /driver/earnings
                          ↓
            Shows income analytics:
            ├─ Total earnings (today/month)
            ├─ Completed rides count
            ├─ Line chart (daily breakdown)
            └─ Recent 10 rides table


                    /driver/wallet
                          ↓
            Shows financial summary:
            ├─ Current balance
            ├─ Top-up options
            ├─ Withdrawal request
            └─ Transaction history


┌───────────────────────────────────────────────────────────────┐
│                NIGHT: GO OFFLINE                               │
└───────────────────────────────────────────────────────────────┘
                          ↓
            Press Toggle to Go Offline
                          ↓
    ┌─────────────────────────────────────────┐
    │ UPDATE drivers.status = 'offline'       │
    │ setOnline(false) in driverStore         │
    │ STOP: useDriverLocation()               │
    │ STOP: useIncomingRide() listener        │
    │ Clear: currentRideId, locationWatchId   │
    └─────────────────────────────────────────┘
                          ↓
                   SLEEP TIME
                   No updates to DB
                   No GPS tracking
                   No ride notifications
```

## 4. ADMIN DRIVER VERIFICATION FLOW

```
┌──────────────────────────────────────────────────────────┐
│           /admin/drivers - Main Dashboard                │
└──────────────────────────────────────────────────────────┘
           ↓
    ┌────────────────────────────────┐
    │  Statistics Cards (Top 4)       │
    ├────────────────────────────────┤
    │ • Total Drivers: 1,245         │
    │ • Active Drivers: 389          │
    │ • Pending Verification: 56     │
    │ • Avg Rating: 4.7              │
    └────────────────────────────────┘
           ↓
    ┌────────────────────────────────┐
    │  Filters & Search Card         │
    ├────────────────────────────────┤
    │ 🔍 Search: [name/phone/email]  │
    │ 📊 Status: [All/Available/...] │
    │ ✓ Registration: [All/Pending...│
    │ ↕️  Sort By: [Created/Rating..] │
    │ [Reset Filters]                │
    └────────────────────────────────┘
           ↓
    ┌────────────────────────────────┐
    │  Driver List Table (20/page)    │
    ├────────────────────────────────┤
    │ Avatar │ Name │ Phone │ Status │
    │────────┼──────┼───────┼────────│
    │  👤   │ John │089... │ ✓      │ ← Click
    │  👤   │ Jane │087... │ ⏳      │   to
    │  👤   │ Bob  │081... │ ❌      │   open
    │  ...  │ ...  │ ...   │ ...    │   detail
    │────────┴──────┴───────┴────────│
    │ ◀ Previous  Page 1/45  Next ▶  │
    └────────────────────────────────┘
           ↓
        CLICK DRIVER ROW
           ↓
    ┌────────────────────────────────────────────┐
    │   Driver Detail Modal (Dialog)              │
    ├────────────────────────────────────────────┤
    │ [Overview] [Docs] [Vehicles] [Earnings]... │
    └────────────────────────────────────────────┘


TAB 1: OVERVIEW
    ├─ Basic Info
    │   ├─ Name: John Doe
    │   ├─ Phone: 0812-3456-7890
    │   ├─ Email: john@email.com
    │   ├─ License: AB-123456
    │   ├─ Status: available
    │   ├─ Rating: 4.8 ⭐
    │   └─ Completed Rides: 342
    │
    ├─ Status Badges
    │   ├─ □ Verified
    │   ├─ □ Pending Document Review
    │   └─ □ Suspended
    │
    └─ Action Buttons
        ├─ [✅ Verify Driver]
        ├─ [❌ Reject Driver]
        ├─ [⏸️ Suspend Driver]
        └─ [↻ Reactivate Driver]


TAB 2: DOCUMENTS
    ├─ KTP (Identity Card)
    │   ├─ Status: ✅ Verified
    │   ├─ Image Preview
    │   ├─ Number: 3201XXXXXXX
    │   └─ [View Full Size]
    │
    ├─ SIM (Driver License)
    │   ├─ Status: ⏳ Pending
    │   ├─ Image Preview
    │   ├─ Expiry: 2025-12-31
    │   ├─ [Verify] [Reject] buttons
    │   └─ [View Full Size]
    │
    └─ STNK (Vehicle Reg)
        ├─ Status: ❌ Rejected
        ├─ Image Preview
        ├─ Rejection Reason: "Image too blurry"
        ├─ Request Resubmit
        └─ [View Full Size]


TAB 3: VEHICLES
    ├─ Vehicle 1
    │   ├─ Plate: B 1234 ABC
    │   ├─ Model: Toyota Avanza
    │   ├─ Type: Car
    │   ├─ Color: White
    │   ├─ Capacity: 5
    │   ├─ Status: ✅ Verified
    │   ├─ [Edit] [Delete] buttons
    │   └─ Documents: SIM ✅, STNK ⏳
    │
    └─ [+ Add Vehicle]


TAB 4: EARNINGS & ANALYTICS
    ├─ Summary
    │   ├─ Total Earnings: Rp 2,456,700
    │   ├─ Completed Rides: 342
    │   ├─ Avg per Ride: Rp 7,181
    │   └─ Active Days: 156
    │
    ├─ Line Chart (Daily Earnings)
    │   └─ Last 30 days visualization
    │
    └─ Recent Rides Table
        ├─ Date │ From │ To │ Fare │ Status
        ├─ 13-04 │ Pusat │ Bandara │ Rp 45.000 │ ✓
        ├─ 13-04 │ Bandara │ Hotel │ Rp 32.000 │ ✓
        └─ ...


TAB 5: ACTIVITY LOG
    ├─ Last 30 Activities
    ├─ Ride Card 1
    │   ├─ Status Badge: ✅ Completed
    │   ├─ Pickup: Jl. Merdeka No. 1
    │   ├─ Dropoff: Bandara Internasional
    │   ├─ Fare: Rp 85,000
    │   ├─ Distance: 25 km
    │   ├─ Time: 13 Apr 2026, 14:30
    │   └─ Duration: 35 minutes
    │
    ├─ Ride Card 2 (Cancelled)
    │   ├─ Status Badge: ❌ Cancelled
    │   ├─ Pickup: Jl. Sudirman
    │   ├─ Reason: Passenger cancelled
    │   └─ Time: 13 Apr 2026, 12:45
    │
    └─ [Show More] (load older activities)


ADMIN ACTIONS FROM DETAIL MODAL
    ↓
    ┌──────────────────────────────────┐
    │  Admin Reviews All Information    │
    └──────────────────────────────────┘
    ↓
    ┌─────────────────────────────────────────┐
    │     ADMIN DECISION                      │
    └─────────────────────────────────────────┘
   /              |              \
  /               |               \
✅ APPROVE      ⏸️ SUSPEND      ❌ REJECT
  |               |                |
  ↓               ↓                ↓
UPDATE:       UPDATE:         UPDATE:
status->      status->        registration_
available     offline         status->
is_verified   (suspended)     rejected
->true                        Send email
|                             with reason
Send                          |
approval                      Driver can
email                         resubmit
|
Driver ready
to accept
rides
```

## 5. DATABASE RELATIONSHIPS

```
auth.users (Supabase Auth)
    │
    ├── user_roles (role: admin/moderator/user)
    │
    ├── profiles (general user info)
    │
    └── drivers (if role = moderator)
        │
        ├── driver_settings (preferences)
        ├── driver_documents (KTP, SIM, STNK)
        │   └── storage buckets (documents)
        │
        ├── vehicles (one or more)
        │   └── vehicle_documents (STNK, insurance)
        │       └── storage buckets (documents)
        │
        └── rides (history, many-to-one)
            ├── ride_ratings (feedback)
            ├── ride_earnings (commission)
            └── riders (one-to-many from profiles)
```

## 6. KEY METRICS TRACKED

```
Per Driver:
├─ Performance
│   ├─ total_rides (completed)
│   ├─ rating (1-5 stars avg)
│   ├─ acceptance_rate (accepted / offered)
│   ├─ completion_rate (completed / accepted)
│   └─ cancellation_rate
│
├─ Financial
│   ├─ total_earnings (sum of fare - commission)
│   ├─ average_fare_per_ride
│   ├─ daily_earnings (grouped by date)
│   └─ pending_withdrawals
│
└─ Operational
    ├─ online_hours (total hours online)
    ├─ vehicles (count & verification status)
    ├─ documents (verification status per type)
    └─ service_area (radius in km)

Per Platform:
├─ Total drivers (by status, by reg status)
├─ Average rating
├─ Total completed rides
├─ Total earnings (commission)
└─ Growth metrics
```

## 7. NOTIFICATION TRIGGERS

```
Driver Notifications:
├─ Ride incoming (realtime via Supabase)
│   └─ Audio chime + Browser notification + Toast
├─ Profile verification status changed
│   └─ Email notification
├─ Document rejected
│   └─ Email with rejection reason
├─ Withdrawal processed
│   └─ Email + In-app notification
└─ Account suspended
    └─ Email notice

Admin Notifications:
├─ New driver registration (pending verification)
│   └─ Dashboard indicator
├─ Document upload received
│   └─ Dashboard flag
├─ Driver issue/complaint reported
│   └─ Email alert
└─ Unusual activity detected
    └─ System alert (if implemented)
```

---

## Summary: Complete Flow Diagram

```
                          PYU-GO DRIVER ECOSYSTEM
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │  DRIVER APPS & WEB                   ADMIN PORTAL         │
    │  ─────────────────                   ────────────         │
    │  • Registration                       • Driver mgmt        │
    │  • Profile Setup                      • Verification      │
    │  • Working Hours                      • Earnings tracking  │
    │  • Vehicle Mgmt                       • Activity monitor   │
    │  • Real-time Rides                                        │
    │  • Earnings & Wallet                                      │
    │                                                             │
    │         ↓                               ↓                  │
    │  ┌─────────────────────────────────────────────────┐     │
    │  │                                                 │     │
    │  │         SUPABASE BACKEND                       │     │
    │  │  ─────────────────────────────────────         │     │
    │  │  • PostgreSQL Database                        │     │
    │  │  • Auth Management                            │     │
    │  │  • Row Level Security (RLS)                   │     │
    │  │  • Realtime Subscriptions                     │     │
    │  │  • Storage Buckets (documents, avatars)       │     │
    │  │  • Edge Functions (complete-ride, etc)        │     │
    │  │                                                 │     │
    │  └─────────────────────────────────────────────────┘     │
    │         ↓                               ↓                  │
    │  DRIVER                            ADMIN                  │
    │  • Online/Offline                  • Reviews driver       │
    │  • GPS tracking                    • Verifies documents   │
    │  • Accepts rides                   • Manages status       │
    │  • Completes trip                  • Views earnings       │
    │  • Earns money                     • Tracks activity      │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

This comprehensive visualization helps understand:
- ✅ End-to-end driver journey
- ✅ Real-time systems & notifications
- ✅ Admin oversight & verification
- ✅ Financial tracking & earnings
- ✅ Database relationships
- ✅ Key business metrics
