# PYU-GO Driver Management - Quick Reference Guide

## 📍 Lokasi File Penting

### Frontend - React Components

| Fungsi | Lokasi | Deskripsi |
|--------|--------|-----------|
| **Driver Registration** | `src/pages/driver/DriverAuth.tsx` | Sign up & login driver |
| **Driver Dashboard** | `src/pages/driver/DriverDashboard.tsx` | Main hub, online/offline toggle, stats |
| **Driver Profile Setup** | `src/pages/driver/DriverProfile.tsx` | 3 tabs: Basic Info, Settings, Vehicles |
| **Active Ride Tracking** | `src/pages/driver/DriverActiveRide.tsx` | Map + tracking saat perjalanan berlangsung |
| **Ride History** | `src/pages/driver/DriverHistory.tsx` | List completed rides |
| **Earnings** | `src/pages/driver/DriverEarnings.tsx` | Analytics & income summary |
| **Wallet** | `src/pages/driver/DriverWallet.tsx` | Balance & withdrawal |
| **Admin Drivers** | `src/pages/admin/AdminDrivers.tsx` | Dashboard verifikasi driver |
| | | |
| **Basic Info Form** | `src/components/driver/profile/BasicInfoForm.tsx` | Personal & license data |
| **Document Upload** | `src/components/driver/profile/DocumentVerification.tsx` | KTP, SIM, STNK |
| **Vehicle Management** | `src/components/driver/profile/VehicleInfo.tsx` | Add/edit/delete vehicles |
| **Admin - Earnings Chart** | `src/components/admin/DriverEarningsAnalytics.tsx` | Visualization driver income |
| **Admin - Activity Log** | `src/components/admin/DriverActivityLog.tsx` | Ride history cards |
| **Admin - Vehicle Mgmt** | `src/components/admin/DriverVehicleManagement.tsx` | Vehicle CRUD in modal |

### Services & Repositories (Business Logic)

| File | Lokasi | Tanggung Jawab |
|------|--------|----------------|
| **DriverProfileService** | `src/services/DriverProfileService.ts` | Get/update driver profile dengan validation |
| **DriverAdminService** | `src/services/DriverAdminService.ts` | Admin queries: drivers, statistics, earnings |
| **DriverProfileRepository** | `src/repositories/DriverProfileRepository.ts` | Database access untuk driver data |

### Hooks (Custom React Hooks)

| Hook | Lokasi | Fungsi |
|------|--------|--------|
| `useAuth()` | `src/hooks/useAuth.ts` | Authentication & role management |
| `useDriverLocation()` | `src/hooks/useDriverLocation.ts` | GPS tracking (update setiap 10 sec) |
| `useIncomingRide()` | `src/hooks/useIncomingRide.ts` | Realtime ride notifications |
| `useRBAC()` | `src/hooks/useRBAC.tsx` | Role-based access control |

### State Management (Zustand)

| Store | Lokasi | Isi |
|-------|--------|-----|
| **authStore** | `src/stores/authStore.ts` | user, session, role, permissions |
| **driverStore** | `src/stores/driverStore.ts` | isOnline, driverId, currentRideId, locationWatchId |

### Database Migrations

| Tanggal | File | Schema |
|--------|------|--------|
| 2026-04-13 20:00 | `20260413200000_comprehensive_driver_profile.sql` | avatar_url, pin_hash, preferences, OTP table |
| 2026-04-13 22:00 | `20260413220000_driver_documents_and_verification.sql` | Document tracking, storage policies |
| 2026-04-13 25:00 | `20260413250000_secure_vehicle_management.sql` | Vehicle table, image_url, is_verified |

---

## 🔄 Driver Lifecycle Ringkas

### 1️⃣ REGISTRATION (5 menit)
```
/driver/auth → Fill form → Email verification → Session restored
```
**Database Changes:**
- `auth.users` - Created (Supabase Auth)
- `drivers` - Created (status: offline, is_verified: false)
- `user_roles` - Created (role: 'moderator')

### 2️⃣ PROFILE SETUP (30 menit)
```
/driver/profile → Tab 1: Basic Info → Tab 2: Settings → Tab 3: Vehicles & Docs
```
**Database Changes:**
- `drivers` - Updated (personal info, license, emergency contact)
- `driver_settings` - Created (working hours, preferences)
- `vehicles` - Created (one or more vehicles)
- `driver_documents` - Created (KTP, SIM, STNK - status: pending)

### 3️⃣ VERIFICATION (Admin reviews)
```
/admin/drivers → Select driver → View all tabs → Verify/Reject
```
**Admin Actions:**
- ✅ Approve → `registration_status: 'approved'`, `is_verified: true`
- ❌ Reject → `registration_status: 'rejected'`, send email
- ⏸️ Suspend → `status: 'offline'`

### 4️⃣ OPERATIONS (Daily)
```
Morning: Go online → Receive rides → Accept & track → Complete ride → View earnings
```
**Real-time Updates:**
- GPS tracking (every 10 sec): `drivers.current_lat/lng`
- Ride notifications: Supabase realtime channel
- Earnings update: `ride_earnings` table created

### 5️⃣ EARNED MONEY
```
Completed ride → Fare recorded → Drive earnings calculated → Wallet updated
```
**Financial Flow:**
- `rides.fare` (total charged)
- `ride_earnings` (gross_fare, commission, net_earnings)
- `drivers.total_earnings` (accumulated)

---

## 🎮 Key UI Interactions

### Driver Side

| Action | Component | Backend Call | Result |
|--------|-----------|-------------|--------|
| **Register** | DriverAuth | `supabase.auth.signUp()` | Account created |
| **Login** | DriverAuth | `supabase.auth.signIn()` | Session restored |
| **Fill Profile** | DriverProfile tabs | `DriverProfileService.updateBasicInfo()` | Data saved |
| **Add Vehicle** | VehicleInfo | `DriverProfileService.createVehicle()` | Vehicle added |
| **Upload Docs** | DocumentVerification | Supabase storage + DB | Docs submitted |
| **Go Online** | DriverDashboard toggle | `drivers.update(status: 'available')` | Start tracking |
| **Accept Ride** | Map/notification | `rides.update(status: 'accepted')` | Ride assigned |
| **Start Ride** | DriverActiveRide | `rides.update(status: 'in_progress')` | Tracking starts |
| **Complete Ride** | DriverActiveRide button | `/complete-ride` edge function | Earnings recorded |
| **Go Offline** | DriverDashboard toggle | `drivers.update(status: 'offline')` | Stop tracking |

### Admin Side

| Action | Component | Backend Call | Result |
|--------|-----------|-------------|--------|
| **View Drivers** | AdminDrivers table | `DriverAdminService.getDriversWithFilters()` | List displayed |
| **Open Driver** | Modal dialog | `DriverAdminService.getDriverDetail()` | Tabs loaded |
| **View Documents** | Documents tab | `supabase.storage.from('documents').download()` | Image shown |
| **Verify Driver** | Overview → button | `updateVerificationStatus('approved')` | Driver approved |
| **Reject Driver** | Documents → button | `updateVerificationStatus('rejected', reason)` | Email sent |
| **View Earnings** | Earnings tab | `DriverAdminService.getDriverEarnings()` | Chart + table |
| **View Activity** | Activity tab | `DriverAdminService.getDriverActivityLog()` | Rides listed |

---

## 📊 Database Tables Ringkas

```
drivers (main profile)
├─ id (UUID)
├─ user_id (FK: auth.users)
├─ full_name, phone, email
├─ license_number, sim_expiry_date
├─ status (available|busy|offline)
├─ is_verified (bool)
├─ registration_status (pending|approved|rejected)
├─ current_lat, current_lng (GPS)
├─ rating (1-5 stars)
├─ total_rides, total_earnings
└─ current_vehicle_id (FK: vehicles)

driver_settings
├─ id, driver_id (FK: drivers)
├─ working_hours_enabled, start/end time
├─ available_{monday...sunday}
├─ service_area_radius_km
├─ auto_accept_rides, auto_accept_timeout_seconds
└─ preferred_payment_method

vehicles
├─ id, driver_id (FK: drivers)
├─ plate_number (UNIQUE)
├─ model, vehicle_type, color
├─ capacity, year
└─ is_verified

driver_documents
├─ id, driver_id (FK: drivers)
├─ document_type (sim|ktp|stnk|insurance)
├─ file_url (Supabase storage path)
├─ status (pending|verified|rejected|expired)
├─ expiry_date
└─ rejection_reason

rides
├─ id, rider_id (FK: profiles), driver_id (FK: drivers)
├─ pickup/dropoff_lat, pickup/dropoff_lng, address
├─ distance_km, duration_minutes
├─ status (pending|accepted|in_progress|completed|cancelled)
├─ fare, payment_method
└─ created_at, accepted_at, started_at, completed_at

ride_earnings
├─ id, ride_id (FK: rides), driver_id (FK: drivers)
├─ gross_fare, commission, net_earnings
└─ created_at

user_roles
├─ id, user_id (FK: auth.users)
└─ role (admin|moderator|user)
```

---

## 🔐 Security & Permissions

### Roles & Permissions

```typescript
ADMIN:
├─ admin:dashboard:view
├─ user:manage
├─ driver:manage
├─ ride:manage
├─ payment:manage
└─ settings:manage

MODERATOR (Driver):
├─ ride:read, ride:update
├─ shuttle:read, shuttle:update
├─ driver:status:toggle
├─ driver:location:update
├─ wallet:view, wallet:topup, wallet:pay
└─ No: ride:create, user:manage

USER:
├─ ride:create, ride:read
├─ shuttle:read, hotel:read
├─ wallet:view, wallet:topup, wallet:pay
└─ No: admin, driver status
```

### Row Level Security (RLS)

```sql
-- Drivers hanya bisa lihat data mereka sendiri
WHERE auth.uid() = user_id

-- Admin bisa lihat semua
WHERE EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')

-- Documents storage (private)
driver_documents bucket:
├─ Users lihat own: auth.uid()::text = (storage.foldername(name))[1]
└─ Admins lihat all: EXISTS (... role = 'admin')
```

---

## 🚀 Performance Tips

| Optimasi | Lokasi | Benefit |
|---------|--------|---------|
| **Code Splitting** | React Router lazy() | Reduce initial bundle |
| **Query Caching** | React Query staleTime | Prevent refetch |
| **Location Batching** | Every 10 sec (not 1 sec) | Save bandwidth |
| **Pagination** | Limit 20 rows/page | Smaller data transfer |
| **Lazy Images** | `<img loading="lazy">` | Faster page load |
| **Geolocation Skip** | Skip duplicate coords | Reduce DB writes |

---

## 🐛 Common Issues & Fixes

| Issue | Penyebab | Solusi |
|-------|---------|--------|
| **Location not updating** | GPS permission denied | Request permission in useIncomingRide |
| **Documents not showing** | Storage policy misconfigured | Check RLS on storage.objects |
| **Verification stuck** | Admin didn't save | Force refresh /admin/drivers |
| **Ride notification missing** | Realtime not connected | Check Supabase realtime config |
| **Can't signup driver** | Email already exists | Check auth.users for duplicates |
| **High CPU usage** | Too frequent location beacons | Change interval to 10sec (currently set) |

---

## 📞 API Endpoints (Supabase Edge Functions)

```typescript
// Complete a ride and record earnings
POST /functions/v1/complete-ride
Body: { ride_id: UUID }
Returns: { success, earnings }

// Get driver statistics (realtime)
RPC: get_driver_statistics()
Returns: { total, active, pending, rejected, avg_rating }

// Auto-initialize driver settings
RPC: initialize_driver_settings(driver_id)
Returns: DriverSettings object
```

---

## 📱 Mobile Apps

| App | Path | Teknologi | Fungsi |
|-----|------|-----------|--------|
| **Driver App** | `driver_app/` | Flutter | Driver terintegrasi pada semua platform |
| **User App** | `users_app/` | Flutter | Rider untuk booking & tracking |

Both apps use same Supabase backend, but dengan filter permissions berbeda.

---

## 🔗 Integration Points

```
Frontend (React) → Supabase → Flutter Apps
                       ↓
                   PostgreSQL
                       ↓
                   Storage Buckets
                       ↓
                   Realtime Channel
```

Semua komponen terhubung melalui Supabase sebagai "single source of truth".

---

## 📈 Monitoring Metrics

Admin dapat track:
- ✅ Driver registration rate
- ✅ Verification approval rate
- ✅ Average earnings per driver
- ✅ Ride completion rate
- ✅ Driver ratings distribution
- ✅ Online hours distribution
- ✅ Cancellation rate
- ✅ Active vehicle count
- ✅ Document verification backlog

---

## 🎯 Next Steps / Future Enhancements

Fitur yang bisa ditambah:
- [ ] Driver batch document upload (multiple drivers)
- [ ] Automated document expiry reminders
- [ ] Driver performance badges/achievements
- [ ] AI-based suspicious activity detection
- [ ] Driver referral program
- [ ] Multi-document status (e.g., SIM expired but vehicle ok)
- [ ] Driver geo-fencing (area restrictions)
- [ ] Earnings prediction model
- [ ] Driver leaderboard/ranking
- [ ] Integration dengan payment gateway untuk withdrawal

---

## 📚 Documentation Files Created

1. **APLIKASI_ANALISIS_KOMPREHENSIF.md**
   - Detail teknis lengkap
   - Arsitektur & design patterns
   - Database schema & relationships
   - Security & RBAC implementation
   - Service layer breakdown

2. **DRIVER_MANAGEMENT_VISUAL_FLOW.md**
   - ASCII diagrams untuk semua flows
   - Visual state transitions
   - Component hierarchy
   - Database relationships diagram

3. **DRIVER_MANAGEMENT_QUICK_REFERENCE.md** (this file)
   - Quick lookup table
   - File locations
   - Common interactions
   - Troubleshooting tips

---

## ✅ Summary

Aplikasi PYU-GO adalah **comprehensive multi-role ride-sharing platform** dengan:

🎯 **Driver Management:**
- Complete lifecycle (registration → verification → operations)
- Real-time GPS tracking & ride notifications
- Earnings analytics & financial tracking
- Document verification workflow

👨‍💼 **Admin Dashboard:**
- Statistics & KPIs
- Driver verification interface
- Earnings breakdown
- Activity monitoring

🔐 **Security:**
- Role-based access control (RBAC)
- Row level security (RLS)
- Document storage policies
- Encrypted sensitive fields

⚡ **Performance:**
- React Query caching
- Lazy code splitting
- Optimized GPS updates
- Pagination for large datasets

---

**Last Updated:** April 13, 2026
**Dokumentasi Status:** ✅ Komprehensif
