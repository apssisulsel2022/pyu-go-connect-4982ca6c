# User Shuttle Flow - Visual Diagram

## Complete Booking Flow (Step-by-Step)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🚐 USER SHUTTLE BOOKING FLOW                            │
│                         (10 Steps with Date Selection)                       │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: SELECT ROUTE
┌──────────────────────────────────────────────────┐
│                                                  │
│  🚌 Shuttle Routes                               │
│  ┌──────────────────────────────────────────┐   │
│  │ Banda Aceh → Lhokseumawe                 │   │
│  │ 🚐 Base Fare: Rp 150.000                 │   │
│  │ 📍 Distance: 60 km                       │   │
│  │ [SELECT]                                 │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ Banda Aceh → Meulaboh                    │   │
│  │ 🚐 Base Fare: Rp 200.000                 │   │
│  │ 📍 Distance: 80 km                       │   │
│  │ [SELECT] ← User picks this               │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓ onSelectRoute()
        setSelectedRouteId = "meulaboh-route-123"
             setSelectedDate = undefined
                   step = "date"


STEP 2: SELECT DATE ✨ NEW
┌──────────────────────────────────────────────────┐
│                                                  │
│  📅 Pilih Tanggal                                │
│  🚐 Banda Aceh → Meulaboh                        │
│  ┌──────────────────────────────────────────┐   │
│  │        April 2026                        │   │
│  │  Mo Tu We Th Fr Sa Su                    │   │
│  │   1  2  3  4  5  6  7                    │   │
│  │   8  9 10 11 12 13 14 ◀ Available dates  │   │
│  │  15 16 17 18 19 20 21 ◀ (highlighted)    │   │
│  │  22 23 24 25 26 27 28                    │   │
│  │  29 30                                   │   │
│  │                                          │   │
│  │  [← Kembali]                             │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  User clicks: 14                                 │
└──────────────────────────────────────────────────┘
                         ↓ onSelectDate()
          setSelectedDate = "April 14, 2026"
              setSelectedScheduleId = null
                   step = "schedule"


STEP 3: SELECT SCHEDULE
┌──────────────────────────────────────────────────┐
│                                                  │
│  ⏱️  Pilih Jadwal                                 │
│  🚐 Banda Aceh → Meulaboh • 14 April 2026 ◄─────│  Date shown!
│  ┌──────────────────────────────────────────┐   │
│  │ 🕐 06:00 → 10:00                         │   │
│  │ 👥 5 seats available                     │   │
│  │ 💰 Rp 200.000/seat                       │   │
│  │ [SELECT]                                 │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🕐 08:00 → 12:00                         │   │
│  │ 👥 3 seats available                     │   │
│  │ 💰 Rp 200.000/seat                       │   │
│  │ [SELECT] ← User picks this               │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🕐 10:00 → 14:00                         │   │
│  │ 👥 7 seats available                     │   │
│  │ 💰 Rp 200.000/seat                       │   │
│  │ [SELECT]                                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓ onSelectSchedule()
       setSelectedScheduleId = "schedule-789"
    setSelectedScheduleDeparture = "2026-04-14T08:00:00Z"
   setSelectedDate = "April 14, 2026" (extracted)
       step = "service"


STEP 4: SELECT SERVICE
┌──────────────────────────────────────────────────┐
│                                                  │
│  🎪 Pilih Layanan                                │
│  🚐 Banda Aceh → Meulaboh • 14 April 2026 ◄─────│  Date persists
│  ┌──────────────────────────────────────────┐   │
│  │ ⭐ ECONOMY                               │   │
│  │ Basic features                           │   │
│  │ [SELECT]                                 │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ ⭐⭐ STANDARD                              │   │
│  │ Extra comfort                            │   │
│  │ [SELECT] ← User picks this               │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ ⭐⭐⭐ PREMIUM                               │   │
│  │ Luxury features                          │   │
│  │ [SELECT]                                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓
        setSelectedServiceTypeId = "service-456"
                   step = "vehicle"


STEP 5: SELECT VEHICLE
┌──────────────────────────────────────────────────┐
│                                                  │
│  🚗 Pilih Jenis Kendaraan                        │
│  🚐 Banda Aceh → Meulaboh • 14 April 2026 ◄─────│  Date persists
│  ┌──────────────────────────────────────────┐   │
│  │ 🚙 SUV Premium                           │   │
│  │ Capacity: 7 seats                        │   │
│  │ AC • Audio • Charger                     │   │
│  │ [PILIH]                                  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🚗 Mini Car                              │   │
│  │ Capacity: 4 seats                        │   │
│  │ AC • Compact                             │   │
│  │ [PILIH] ← User picks this                │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 🚐 Hiace Executive                       │   │
│  │ Capacity: 10 seats                       │   │
│  │ AC • Reclining • TV • Charger            │   │
│  │ [PILIH]                                  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓
         setSelectedVehicleType = "MiniCar"
                   step = "pickup"


STEP 6: SELECT PICKUP POINT
┌──────────────────────────────────────────────────┐
│                                                  │
│  📍 Pilih Titik Jemput                           │
│  🚐 Banda Aceh → Meulaboh • 14 April 2026 ◄─────│  Date shown
│  ┌──────────────────────────────────────────┐   │
│  │ RAYON A:                                 │   │
│  │ ├─ J1 Hermes Palace       06:00          │   │
│  │ │  Fare: Rp 200.000                      │   │
│  │ │  [SELECT]                              │   │
│  │ ├─ J2 Airport Terminal    06:30          │   │
│  │ │  Fare: Rp 210.000                      │   │
│  │ │  [SELECT] ← User picks this            │   │
│  │ └─ J3 Main Station        07:00          │   │
│  │    Fare: Rp 220.000                      │   │
│  │    [SELECT]                              │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓
          setSelectedPickupPoint = {...}
            setSelectedRayonId = "rayon-A"
                   step = "seats"


STEP 7: SELECT SEATS
┌──────────────────────────────────────────────────┐
│                                                  │
│  💺 Pilih Kursi                                  │
│  🚐 Banda Aceh → Meulaboh • 14 Apr 2026, 08:00  │ Full datetime
│  📍 Airport Terminal (Rayon A)                   │
│  ┌──────────────────────────────────────────┐   │
│  │ [A1] [A2] [A3] [A4]                      │   │
│  │ [B1] [B2✓] [B3✓] [B4]  ← User selected   │   │
│  │ [C1] [C2] [C3] [C4]                      │   │
│  │                                          │   │
│  │ 💺 Kursi Dipilih: B2, B3                 │   │
│  │ 💰 Total: Rp 420.000 (2 × Rp 210.000)   │   │
│  │                                          │   │
│  │ [← Kembali] [LANJUT →]                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓ onConfirmSeats()
              Reserve seats (10 min lock)
             setSelectedSeats = ["B2", "B3"]
              setLockedUntil = now + 10min
                  step = "guest_info"


STEP 8: GUEST INFORMATION
┌──────────────────────────────────────────────────┐
│  ⏱️  Sisa Waktu: 9:45                             │
│                                                  │
│  👤 Data Penumpang                               │
│  ┌──────────────────────────────────────────┐   │
│  │ Nama                                     │   │
│  │ [John Doe____________]                   │   │
│  │ Nomor HP                                 │   │
│  │ [+62 812 3456 7890__]                    │   │
│  │                                          │   │
│  │ [← Kembali] [LANJUT →]                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓
         setGuestName = "John Doe"
       setGuestPhone = "+62812345678"
            step = "payment"


STEP 9: PAYMENT METHOD
┌──────────────────────────────────────────────────┐
│  ⏱️  Sisa Waktu: 8:30                             │
│                                                  │
│  💳 Metode Pembayaran                            │
│  ┌──────────────────────────────────────────┐   │
│  │ 💵 CASH                                  │   │
│  │ Bayar di lokasi penjemputan              │   │
│  │ [PILIH] ← User picks this                │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 💳 ONLINE (Midtrans/Xendit)              │   │
│  │ Pembayaran instant via E-wallet          │   │
│  │ [PILIH]                                  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
                         ↓ handlePayCash()
        create_shuttle_booking_atomic RPC
       setPaymentMethod = "cash"
       setPaymentStatus = "unpaid"
           step = "confirmation"


STEP 10: CONFIRMATION & E-TICKET ✅
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │    🎫 PYU GO SHUTTLE E-TICKET           │     │
│  ├────────────────────────────────────────┤     │
│  │  [QR CODE]                             │     │
│  │  PYU-20260414-ABC12                    │     │
│  ├────────────────────────────────────────┤     │
│  │  Route: Banda Aceh → Meulaboh          │     │
│  │  From: Banda Aceh                      │     │
│  │  To: Meulaboh                          │     │
│  │  Pickup: Airport Terminal              │     │
│  │  📅 Departure: 14 Apr 2026, 08:00 ◄────────│  DATE ✅
│  │  💺 Seats: B2, B3                      │     │
│  │  👤 Passenger: John Doe                │     │
│  │  📱 Phone: +62812345678                │     │
│  │  💰 Total: Rp 420.000                  │     │
│  │  📋 Payment: UNPAID (Pay on arrival)   │     │
│  ├────────────────────────────────────────┤     │
│  │  [← Back] [DOWNLOAD TICKET] [HOME]     │     │
│  └────────────────────────────────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘

                       ✅ BOOKING COMPLETE ✅

```

---

## Flow Comparison

### Before (No Date Selection)
```
Routes → Schedule → Service → Vehicle → Pickup → Seats → Guest → Payment → Confirmation
         (all schedules shown, confusing)
```

### After (With Date Selection) ✨
```
Routes → DATE → Schedule → Service → Vehicle → Pickup → Seats → Guest → Payment → Confirmation
         (calendar with filtering)     (only selected date)
```

---

## Key Features Highlighted

| Feature | Before | After |
|---------|--------|-------|
| Date Selection | ❌ Hidden in schedule | ✅ **Explicit calendar step** |
| Available Dates | ❌ Not visible | ✅ **Highlighted in calendar** |
| Schedule Filtering | ❌ All dates mixed | ✅ **Only selected date shown** |
| Date Display | ❌ Missing header | ✅ **Shown throughout flow** |
| Date in Ticket | ⚠️ Present | ✅ **Prominent display** |
| User Experience | ⚠️ Confusing | ✅ **Clear step-by-step** |

---

## State Tracking Through Flow

```
Route Selection
├─ selectedRouteId ✅
├─ selectedDate ← RESET to undefined
└─ step ← "date"

Date Selection
├─ selectedDate ✅ ← NEWLY SET
└─ step ← "schedule"

Schedule Selection
├─ selectedScheduleId ✅
├─ selectedScheduleDeparture ✅
├─ selectedDate ← UPDATED from schedule
└─ step ← "service"

Service Selection
├─ selectedServiceTypeId ✅
└─ step ← "vehicle"

Vehicle Selection
├─ selectedVehicleType ✅
└─ step ← "pickup"

Pickup Selection
├─ selectedPickupPoint ✅
├─ selectedRayonId ✅
└─ step ← "seats"

Seat Selection
├─ selectedSeats ✅
├─ lockedUntil ← SET (10 min timer)
└─ step ← "guest_info"

Guest Info
├─ guestName ✅
├─ guestPhone ✅
└─ step ← "payment"

Payment
├─ paymentMethod ✅
├─ paymentStatus ✅
└─ create_shuttle_booking_atomic RPC
        ↓
    booking created
    email sent
    step ← "confirmation"

Confirmation
├─ bookingRef ← displayed
├─ bookingId ← for download
└─ ShuttleTicket shows all info including:
   - ✅ departure date & time
   - ✅ passenger info
   - ✅ seats
   - ✅ payment status
```

---

## Build Configuration

```
✓ Step added to TypeScript union type
✓ Import added for DateSelector
✓ Handler function added
✓ Navigation logic updated
✓ Filtering logic enhanced
✓ UI component added
✓ Back button logic updated
✓ State reset logic updated
✓ Progress tracking updated
```

**All changes compile without errors ✅**

