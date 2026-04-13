# PYU-GO Ride-Sharing Platform - Analisis Komprehensif

**Date:** April 13, 2026  
**Platform:** Multi-mode ride-sharing dengan dukungan admin dan driver management

---

## 📋 Daftar Isi
1. [Overview Aplikasi](#overview-aplikasi)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Driver Management Flow](#driver-management-flow)
4. [Struktur Teknis](#struktur-teknis)
5. [Database Schema](#database-schema)
6. [State Management](#state-management)
7. [Service Layer](#service-layer)
8. [Security & RBAC](#security--rbac)

---

## Overview Aplikasi

### Platform Multi-Role
Aplikasi ini mendukung **3 role utama** dengan permission yang berbeda:

| Role | Alias | Akses | Fungsi Utama |
|------|-------|-------|-------------|
| **User** | user | `/`, `/ride`, `/hotel`, `/wallet`, `/shuttle`, `/profile` | Pengguna untuk booking ride, shuttle, dan hotel |
| **Driver** | moderator | `/driver/*` | Penyedia layanan transportasi (bike, car, shuttle) |
| **Admin** | admin | `/admin/*` | Manajemen sistem, driver, ride, payment |

### Tech Stack Lengkap

**Frontend:**
- React 18 + TypeScript + Vite
- UI Components: shadcn/ui (Radix + Tailwind CSS)
- State Management: Zustand
- Data Fetching: TanStack React Query (@tanstack/react-query)
- Maps: Leaflet (real-time tracking)
- Forms: React Hook Form + Zod validation
- i18n: i18next (Indonesian support)
- Routing: React Router v6 dengan lazy code splitting

**Backend:**
- Supabase (PostgreSQL + Auth + Realtime)
- RLS (Row Level Security) untuk multi-tenant
- Bucket storage untuk document uploads
- Realtime subscriptions untuk WebSocket notifications

**Mobile:**
- Flutter (driver_app dan users_app)
- Native support untuk iOS, Android, Linux, macOS, Windows

**DevOps:**
- Build: Vite
- Deployment: Vercel
- Testing: Vitest
- Linting: ESLint

---

## Arsitektur Sistem

### 1. Struktur Folder Frontend

```
src/
├── components/           # Reusable React components
│   ├── admin/           # Admin-specific components
│   │   ├── AdminPagination.tsx
│   │   ├── DriverAdminService.ts
│   │   ├── DriverEarningsAnalytics.tsx
│   │   ├── DriverActivityLog.tsx
│   │   └── DriverVehicleManagement.tsx
│   ├── driver/          # Driver-specific components
│   │   └── profile/
│   │       ├── BasicInfoForm.tsx
│   │       ├── DocumentVerification.tsx
│   │       ├── ProfilePhoto.tsx
│   │       ├── SecuritySettings.tsx
│   │       ├── ServiceSettings.tsx
│   │       └── VehicleInfo.tsx
│   ├── layout/
│   ├── map/             # Map components (Leaflet)
│   ├── ride/            # Ride-related components
│   ├── shuttle/         # Shuttle-related components
│   ├── hotel/           # Hotel-related components
│   ├── wallet/          # Payment & wallet components
│   └── ui/              # shadcn/ui base components
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Auth state & session management
│   ├── useRBAC.tsx      # Role-based access control
│   ├── useDriverLocation.ts    # GPS tracking
│   ├── useIncomingRide.ts      # Real-time ride notifications
│   └── use-mobile.tsx
│
├── pages/               # Page-level components (Router)
│   ├── Auth.tsx
│   ├── Index.tsx (Home)
│   ├── Ride.tsx
│   ├── Shuttle.tsx
│   ├── Hotel.tsx
│   ├── Wallet.tsx
│   ├── Profile.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminDrivers.tsx
│   │   ├── AdminRides.tsx
│   │   ├── AdminShuttles.tsx
│   │   └── ...
│   └── driver/
│       ├── DriverDashboard.tsx
│       ├── DriverAuth.tsx
│       ├── DriverProfile.tsx
│       ├── DriverActiveRide.tsx
│       ├── DriverHistory.tsx
│       ├── DriverEarnings.tsx
│       ├── DriverWallet.tsx
│       ├── DriverShuttle.tsx
│       ├── DriverLayout.tsx
│       └── tabs/
│           ├── DriverBasicInfoTab.tsx
│           ├── DriverVehiclesTab.tsx
│           └── DriverSettingsTab.tsx
│
├── services/           # Business logic layer
│   ├── DriverAdminService.ts
│   ├── DriverProfileService.ts
│   └── UserProfileService.ts
│
├── repositories/       # Data access layer
│   ├── DriverProfileRepository.ts
│   └── UserProfileRepository.ts
│
├── stores/             # Zustand state stores
│   ├── authStore.ts
│   └── driverStore.ts
│
├── lib/                # Utilities & helpers
│   ├── rbac.ts         # Role & permission definitions
│   ├── fareCalculation.ts
│   ├── location.ts
│   ├── utils.ts
│   ├── i18n.ts
│   └── ab-test.ts
│
└── integrations/
    └── supabase/
        └── client.ts   # Supabase client config
```

### 2. Route Structure

**User Routes:**
```
/ (Home)
/ride (Book ride)
/hotel (Browse hotels)
/hotel/:id (Hotel detail)
/shuttle (Shuttle booking)
/wallet (Payment & wallet)
/profile (User profile)
/auth (Authentication)
```

**Driver Routes:**
```
/driver (Dashboard)
├── /driver/ride (Active ride with tracking)
├── /driver/shuttle (Shuttle assignments)
├── /driver/earnings (Income summary)
├── /driver/wallet (Withdrawal & balance)
├── /driver/history (Completed rides)
├── /driver/profile (Profile management)
│   ├── Basic Info (KTP, license, contact)
│   ├── Vehicles (Add/edit/delete vehicles)
│   ├── Settings (Working hours, area, preferences)
│   └── Documents (Upload verification docs)
└── /driver/auth (Driver-specific auth)
```

**Admin Routes:**
```
/admin (Dashboard)
├── /admin/drivers (Driver management & verification)
│   ├── Overview tab (Statistics)
│   ├── Documents tab (Verification status)
│   ├── Vehicles tab (Vehicle management)
│   ├── Earnings tab (Income analytics)
│   └── Activity tab (Ride history)
├── /admin/rides (Ride monitoring)
├── /admin/shuttles (Shuttle operations)
├── /admin/hotels (Partner management)
├── /admin/users (User management)
├── /admin/payments (Payment reconciliation)
├── /admin/withdrawals (Withdrawal requests)
└── /admin/settings (System config)
```

---

## Driver Management Flow

### 1. Fase Onboarding Driver

```
┌─────────────────────────────────────────────────────────────┐
│                    DRIVER ONBOARDING FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. DRIVER REGISTRATION
   └─> /driver/auth (DriverAuth.tsx)
       ├─ Input: Email, Password, Full Name, Phone, License Number
       ├─ Action: signUp() via useAuth hook
       └─ Backend: 
           ├─ Create user in auth.users (Supabase Auth)
           ├─ Create driver record in drivers table (status: offline, is_verified: false)
           ├─ Create user_roles record (role: 'moderator')
           ├─ Trigger trigger_new_user_profile() untuk auto-init profile
           └─ Send email verification

2. EMAIL VERIFICATION
   └─> User clicks verification link in email
       └─ Session restored, user redirected to /driver

3. COMPLETE DRIVER PROFILE
   └─> /driver/profile (DriverProfile.tsx)
       ├─ Tab 1: Basic Information
       │   ├─ Full Name & Contact
       │   ├─ Gender, Date of Birth
       │   ├─ License Number, SIM Expiry
       │   ├─ Address, Emergency Contact
       │   └─ Component: DriverBasicInfoTab.tsx
       │
       ├─ Tab 2: Availability & Service Settings
       │   ├─ Working Hours (enable/disable, start-end time)
       │   ├─ Available Days (dropdown Monday-Sunday)
       │   ├─ Service Area (radius in km)
       │   ├─ Auto-accept rides (enable/timeout)
       │   ├─ Preferred Payment Method
       │   └─ Component: DriverSettingsTab.tsx
       │
       └─ Tab 3: Vehicles & Documents
           ├─ Vehicle Management (CRUD)
           │   ├─ Add Vehicle Dialog
           │   ├─ Fields: plate_number, model, type, color, capacity
           │   └─ Component: DriverVehiclesTab.tsx
           │
           └─ Document Verification
               ├─ Upload Documents (KTP, SIM, STNK)
               ├─ Status: pending → verified/rejected
               ├─ Admin can reject with reason
               └─ Component: DocumentVerification.tsx

4. ADMIN VERIFICATION
   └─> /admin/drivers (AdminDrivers.tsx)
       ├─ Admin Reviews Driver Profile
       ├─ Check Documents (KTP, SIM, STNK URLs)
       ├─ Analyze Vehicles
       ├─ View Earnings & Activity
       └─ Actions:
           ├─ ✅ Approve (status → available, is_verified: true)
           ├─ ❌ Reject (registration_status: rejected, send email)
           └─ 🔄 Request Additional Info
```

### 2. Driver Dashboard & Daily Operations

```
┌──────────────────────────────────────────────────────────┐
│               DRIVER DAILY OPERATION FLOW                │
└──────────────────────────────────────────────────────────┘

MORNING: Go Online
├─ /driver (DriverDashboard.tsx)
├─ Click toggle button to set status: available
├─ Actions taken:
│   ├─ Update driver.status = 'available' in Supabase
│   ├─ setOnline(true) in driverStore (Zustand)
│   ├─ Start useDriverLocation() hook
│   │   └─ Every 10 seconds: update driver.current_lat, driver.current_lng
│   ├─ Start useIncomingRide() hook
│   │   └─ Subscribe to rides realtime updates (Supabase channel)
│   └─ Show metrics: today's rides, earnings, rating
│
├─ REAL-TIME LOCATION TRACKING (useDriverLocation.ts)
│   ├─ Enabled only when isOnline = true
│   ├─ Call navigator.geolocation.getCurrentPosition()
│   ├─ Skip duplicate positions (same lat/lng)
│   ├─ Update every 10 seconds
│   └─ Store in drivers table (current_lat, current_lng)
│
└─ LISTEN FOR INCOMING RIDES (useIncomingRide.ts)
    ├─ Supabase realtime channel: driver-rides-{driverId}
    ├─ Listen to rides table UPDATE events
    ├─ Filter: driver_id = current driver, status = 'accepted'
    ├─ Actions when ride arrives:
    │   ├─ Play notification sound (Web Audio API - A5→C#6→E6 chime)
    │   ├─ Show browser notification (if permission granted)
    │   ├─ Show toast notification (sonner)
    │   ├─ setCurrentRideId(ride.id) in driverStore
    │   └─ Auto-navigate driver to /driver/ride
    └─ Fallback: Driver can manually select active ride

DURING RIDE: Active Ride Management
├─ /driver/ride (DriverActiveRide.tsx)
├─ Display:
│   ├─ Map with pickup (green marker) & dropoff (red marker)
│   ├─ Route (dashed line)
│   ├─ Ride status (Menuju Pickup / Dalam Perjalanan / Selesai)
│   ├─ Fare amount (Rp)
│   ├─ Passenger info (name, phone)
│   └─ Distance, duration, address
│
├─ Driver Actions:
│   ├─ Button: "Mulai Perjalanan"
│   │   └─ Change status: accepted → in_progress
│   │
│   ├─ Button: "Selesai"
│   │   └─ Call /complete-ride edge function
│   │   └─ Create ride_earnings record for driver
│   │   └─ Update ride.status = completed
│   │   └─ Update driver.total_earnings
│   │   └─ Close ride, redirect to /driver
│   │
│   └─ Contact passenger (phone button)
│
└─ Auto-refetch: Query updated every 5 seconds

EVENING: History & Earnings
├─ /driver/history (DriverHistory.tsx)
│   └─ List all completed rides with:
│       ├─ Passenger name
│       ├─ Pickup address & coordinates
│       ├─ Dropoff address
│       ├─ Fare
│       ├─ Status badge
│       └─ Completion time
│
├─ /driver/earnings (DriverEarnings.tsx)
│   └─ Display:
│       ├─ Total earnings (today/month)
│       ├─ Completed rides count
│       ├─ Average earnings per ride
│       ├─ Line chart of daily earnings (Recharts)
│       ├─ Recent 10 rides table
│       └─ Currency format: IDR (Rp)
│
└─ /driver/wallet (DriverWallet.tsx)
    └─ Wallet management:
        ├─ Current balance
        ├─ Top-up wallet
        ├─ Request withdrawal
        └─ Transaction history

BEFORE SLEEP: Go Offline
└─ Click toggle to set status: offline
    ├─ Update driver.status = 'offline'
    ├─ setOnline(false) in driverStore
    ├─ Clear locationWatchId
    ├─ Unsubscribe from rides channel
    └─ No more location updates
```

### 3. Driver Status Transitions

```
┌──────────────────────────────────────────────────────────┐
│                  DRIVER STATUS FLOW                      │
└──────────────────────────────────────────────────────────┘

AVAILABLE ──(ride accepted)──> BUSY
                                  │
                                  ├─(ride in_progress)
                                  │   └─> BUSY (with active ride)
                                  │
                                  └─(ride completed)
                                      └─> AVAILABLE

AVAILABLE ──(toggle offline)──> OFFLINE

OFFLINE ──(toggle online)──> AVAILABLE

OFFLINE ──(admin suspends)──> OFFLINE (suspended)

Status Values in DB:
├─ available: Siap menerima ride
├─ busy: Sedang mengantarkan penumpang
└─ offline: Tidak aktif / offline

Registration Status (Verification):
├─ pending: Menunggu verifikasi admin
├─ approved: Sudah diverifikasi, bisa menerima ride
└─ rejected: Ditolak, perlu perbaikan dokumen
```

### 4. Document Verification Flow

```
┌──────────────────────────────────────────────────────────┐
│              DOCUMENT VERIFICATION PROCESS               │
└──────────────────────────────────────────────────────────┘

DRIVER UPLOADS DOCUMENTS
├─ /driver/profile → Documents Tab
├─ Upload types:
│   ├─ KTP (ID card) - required
│   ├─ SIM (Driver license) - required
│   ├─ STNK (Vehicle registration) - required per vehicle
│   ├─ Insurance - optional
│   └─ Other - optional
│
└─ Files stored in Supabase Storage:
    └─ Bucket: "documents"
    └─ Path: /user_id/document_type/filename
    └─ RLS: Only owner & admin can access

ADMIN REVIEWS & VERIFIES
├─ /admin/drivers → Driver Detail Modal → Documents Tab
├─ Admin can:
│   ├─ View uploaded documents via URL
│   ├─ Verify document (set status: verified)
│   ├─ Reject document (set status: rejected + reason)
│   └─ Request re-upload
│
└─ DB Update:
    ├─ drivers table:
    │   ├─ ktp_url, sim_url, vehicle_stnk_url (URLs)
    │   ├─ registration_status (pending/approved/rejected)
    │   └─ rejection_reason (text if rejected)
    │
    └─ driver_documents table:
        ├─ id, driver_id, document_type
        ├─ file_url, status, expiry_date
        ├─ submitted_at, verified_at/rejected_at
        └─ rejection_reason

AFTER APPROVAL
├─ registration_status = 'approved'
├─ is_verified = true
├─ Can now accept rides
└─ Cannot accept if any required document rejected
```

---

## Struktur Teknis

### 1. Authentication Flow

```typescript
// useAuth.ts - Hooks untuk auth management

export function useAuth() {
  const {
    user,              // Supabase Auth User object
    session,           // Auth session
    role,              // 'admin' | 'moderator' (driver) | 'user'
    permissions,       // Array of allowed permissions
    isLoading,
    isGuest,
    setUser,
    setSession,
    setRole,
    signIn,            // (email, password) => Promise
    signUp,            // (email, password, name, metadata) => Promise
    signOut,           // () => Promise
  } = useAuth();
}

FLOW:
1. initializeAuth() - Try to recover from session
2. supabase.auth.getSession() - Get stored session
3. If session exists:
   ├─ setSession(sessionData)
   ├─ Fetch user role dari user_roles table
   ├─ setRole(role)
   └─ Derived permissions berdasarkan role
4. Listen supabase.auth.onAuthStateChange()
   ├─ SIGNED_OUT: reset state
   ├─ SIGNED_IN: fetch role
   └─ Update zustand store
```

### 2. Driver Store - State Management

```typescript
// driverStore.ts (Zustand)

interface DriverState {
  isOnline: boolean;              // Driver online status
  driverId: string | null;        // UUID dari driver record
  currentRideId: string | null;   // Active ride UUID
  locationWatchId: number | null; // Geolocation watch handle
  
  // Actions
  setOnline(online: boolean): void;
  setDriverId(id: string | null): void;
  setCurrentRideId(id: string | null): void;
  setLocationWatchId(id: number | null): void;
  reset(): void;
}

// Usage di components:
const { isOnline, setOnline, driverId, setDriverId } = useDriverStore();
```

### 3. Component Hierarchy - Driver Profile

```
DriverProfile (parent page)
├─ Tabs Container
├─ Tab 1: DriverBasicInfoTab
│   └─ BasicInfoForm.tsx
│       ├─ Input: full_name, phone
│       ├─ Input: gender, date_of_birth
│       ├─ Input: license_number, sim_expiry_date
│       ├─ Textarea: address
│       └─ Input: emergency_contact_*
│
├─ Tab 2: DriverSettingsTab
│   └─ ServiceSettings.tsx
│       ├─ Toggle: working_hours_enabled
│       ├─ Time: working_hours_start/end
│       ├─ Checkboxes: available_monday...sunday
│       ├─ Input: service_area_radius_km
│       ├─ Toggle: auto_accept_rides
│       ├─ Input: auto_accept_timeout_seconds
│       └─ Select: preferred_payment_method
│
└─ Tab 3: DriverVehiclesTab
    ├─ VehicleInfo.tsx
    │   ├─ Add Vehicle Dialog (form)
    │   ├─ Edit Vehicle Dialog (form)
    │   └─ Delete Vehicle Confirmation
    │
    ├─ ProfilePhoto.tsx
    │   ├─ Avatar upload
    │   ├─ Crop tool
    │   └─ Store in avatars bucket
    │
    ├─ DocumentVerification.tsx
    │   ├─ Upload KTP
    │   ├─ Upload SIM (with expiry)
    │   ├─ Upload STNK
    │   ├─ Status badges (pending/verified/rejected)
    │   └─ Show rejection reason if rejected
    │
    └─ SecuritySettings.tsx
        ├─ Change password
        └─ Set/change PIN
```

### 4. Component Hierarchy - Admin Driver Management

```
AdminDrivers (main page)
├─ Card: Statistics (4 metrics)
│   ├─ Total Drivers
│   ├─ Active Drivers
│   ├─ Pending Verification
│   └─ Average Rating
│
├─ Card: Filters & Search
│   ├─ TextInput: Search (name/phone/email)
│   ├─ Select: Filter by Status
│   ├─ Select: Filter by Registration Status
│   ├─ Select: Sort By
│   └─ Button: Reset Filters
│
├─ Table: Driver List (DataTable component)
│   ├─ Columns: Avatar, Name, Phone, Email, Status, Rating
│   ├─ Pagination: 20 rows per page
│   └─ Row click: Open Detail Modal
│
└─ Modal: Driver Detail (Dialog component)
    ├─ Tab 1: Overview
    │   ├─ Basic info (name, phone, email, license)
    │   ├─ Status badges
    │   ├─ Rating & completed rides
    │   ├─ Action buttons (Verify/Reject/Suspend/Reactivate)
    │   └─ Verification status
    │
    ├─ Tab 2: Documents
    │   ├─ KTP
    │   │   ├─ Image preview
    │   │   ├─ Status badge
    │   │   ├─ Button: View full
    │   │   └─ If pending: Verify/Reject buttons
    │   ├─ SIM (same structure)
    │   └─ STNK (same structure)
    │
    ├─ Tab 3: Vehicles
    │   └─ DriverVehicleManagement.tsx
    │       ├─ Add Vehicle Dialog
    │       ├─ Vehicle Table
    │       ├─ Edit Vehicle Dialog
    │       └─ Delete Confirmation
    │
    ├─ Tab 4: Earnings
    │   └─ DriverEarningsAnalytics.tsx
    │       ├─ Summary Cards (total, avg per ride, active days)
    │       ├─ LineChart: Daily earnings (Recharts)
    │       └─ Recent rides table (last 10)
    │
    └─ Tab 5: Activity
        └─ DriverActivityLog.tsx
            ├─ Activity cards (last 30)
            ├─ Card: pickup/dropoff address, fare, distance
            ├─ Color-coded status badges
            └─ Timestamps
```

---

## Database Schema

### 1. Core Driver Tables

```sql
-- drivers table (main driver profile)
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT, -- 'male' | 'female'
  date_of_birth DATE,
  address TEXT,
  
  -- Driver credentials
  license_number TEXT,
  sim_expiry_date DATE,
  ktp_number TEXT,
  
  -- Document URLs
  avatar_url TEXT,
  ktp_url TEXT,
  sim_url TEXT,
  vehicle_stnk_url TEXT,
  
  -- Status & verification
  status TEXT NOT NULL DEFAULT 'offline', -- 'available' | 'busy' | 'offline'
  is_verified BOOLEAN DEFAULT false,
  registration_status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  
  -- Location
  current_lat FLOAT,
  current_lng FLOAT,
  
  -- Ratings & stats
  rating FLOAT DEFAULT 0, -- 1-5 stars
  total_rides INT DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  
  -- Vehicle preference
  current_vehicle_id UUID REFERENCES vehicles(id),
  prefers_bike BOOLEAN DEFAULT true,
  prefers_bike_women BOOLEAN DEFAULT false,
  prefers_car BOOLEAN DEFAULT true,
  
  -- Security
  pin_hash TEXT,
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('available', 'busy', 'offline')),
  CONSTRAINT valid_registration CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_registration_status ON drivers(registration_status);
```

### 2. Driver Settings & Documents

```sql
-- driver_settings (working hours & preferences)
CREATE TABLE driver_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE UNIQUE,
  
  -- Working hours
  working_hours_enabled BOOLEAN DEFAULT false,
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end TIME DEFAULT '20:00',
  
  -- Available days (0=Sunday through 6=Saturday)
  available_monday BOOLEAN DEFAULT true,
  available_tuesday BOOLEAN DEFAULT true,
  available_wednesday BOOLEAN DEFAULT true,
  available_thursday BOOLEAN DEFAULT true,
  available_friday BOOLEAN DEFAULT true,
  available_saturday BOOLEAN DEFAULT true,
  available_sunday BOOLEAN DEFAULT false,
  
  -- Service area
  service_area_radius_km FLOAT DEFAULT 50,
  
  -- Auto-accept settings
  auto_accept_rides BOOLEAN DEFAULT false,
  auto_accept_timeout_seconds INT DEFAULT 10,
  
  -- Payment preference
  preferred_payment_method TEXT DEFAULT 'cash', -- 'cash' | 'wallet' | 'card'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- driver_documents (document tracking)
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'sim' | 'ktp' | 'stnk' | 'insurance' | 'other'
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'verified' | 'rejected' | 'expired'
  expiry_date DATE,
  
  -- Audit timestamps
  submitted_at TIMESTAMP DEFAULT now(),
  verified_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_doc_type CHECK (document_type IN ('sim', 'ktp', 'stnk', 'insurance', 'other'))
);

CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
```

### 3. Vehicle Management

```sql
-- vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- Vehicle details
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, -- 'bike' | 'car' | 'truck' | 'van'
  model TEXT NOT NULL,
  color TEXT,
  capacity INT, -- Number of passengers
  year INT,
  image_url TEXT,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE UNIQUE INDEX idx_vehicles_plate_number ON vehicles(plate_number);

-- vehicle_documents table
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'stnk' | 'insurance' | 'tax_paid'
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expiry_date DATE,
  
  submitted_at TIMESTAMP DEFAULT now(),
  verified_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 4. Rides Table

```sql
-- rides table (ride bookings & tracking)
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES auth.users(id),
  driver_id UUID REFERENCES drivers(id),
  
  -- Location info
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  pickup_address TEXT,
  
  dropoff_lat FLOAT NOT NULL,
  dropoff_lng FLOAT NOT NULL,
  dropoff_address TEXT,
  
  -- Ride details
  distance_km FLOAT,
  duration_minutes INT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  
  -- Pricing
  fare DECIMAL(10, 2),
  payment_method TEXT, -- 'cash' | 'wallet' | 'card'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
```

### 5. Related Tables

```sql
-- user_roles table (RBAC)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'moderator' | 'user'
  created_at TIMESTAMP DEFAULT now()
);

-- profiles table (general user profiles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ride_ratings table (feedback after ride)
CREATE TABLE ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id),
  rated_id UUID NOT NULL REFERENCES auth.users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- ride_earnings table (commission tracking)
CREATE TABLE ride_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE UNIQUE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  gross_fare DECIMAL(10, 2),
  commission DECIMAL(10, 2),
  net_earnings DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT now()
);
```

---

## State Management

### 1. Zustand Stores

#### authStore.ts
```typescript
interface AuthState {
  // Auth data
  user: User | null;         // Supabase Auth.User object
  session: Session | null;   // Auth session
  
  // Authorization
  role: 'admin' | 'moderator' | 'user' | null;
  permissions: Permission[];
  
  // UI state
  isLoading: boolean;
  isGuest: boolean;
  
  // Actions
  setUser(user: User | null): void;
  setSession(session: Session | null): void;
  setRole(role: Role | null): void;
  setPermissions(perms: Permission[]): void;
  setLoading(loading: boolean): void;
  setGuest(guest: boolean): void;
  reset(): void;
}

// Usage:
const { user, role, permissions, isLoading } = useAuthStore();
```

#### driverStore.ts
```typescript
interface DriverState {
  // Driver status
  isOnline: boolean;             // true = available/busy, false = offline
  driverId: string | null;       // UUID dari driver record
  currentRideId: string | null;  // ID of active ride
  
  // Geolocation
  locationWatchId: number | null;  // From navigator.geolocation.watchPosition
  
  // Actions
  setOnline(online: boolean): void;
  setDriverId(id: string | null): void;
  setCurrentRideId(id: string | null): void;
  setLocationWatchId(id: number | null): void;
  reset(): void;
}

// Usage:
const { isOnline, setOnline, driverId } = useDriverStore();
```

### 2. React Query Hooks

```typescript
// In components:

// Fetch driver profile
const { data: driver } = useQuery({
  queryKey: ['driver-profile', userId],
  queryFn: () => DriverProfileService.getDriverComplete(userId),
  staleTime: 5 * 60 * 1000 // 5 minutes
});

// Fetch vehicles
const { data: vehicles } = useQuery({
  queryKey: ['driver-vehicles', driverId],
  queryFn: () => supabase.from('vehicles').select('*').eq('driver_id', driverId),
  enabled: !!driverId
});

// Mutations for updates
const updateProfileMutation = useMutation({
  mutationFn: (data) => DriverProfileService.updateBasicInfo(driverId, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    toast.success('Profile updated!');
  }
});
```

---

## Service Layer

### 1. DriverProfileService

Encapsulates business logic untuk driver profile operations:

```typescript
class DriverProfileService {
  // Fetch complete driver data
  static async getDriverComplete(userId: string)
    returns { profile, settings, vehicles, documents }

  // Update basic info with validation
  static async updateBasicInfo(driverId: string, data)
    validates: license number, SIM expiry, age >= 18

  // Update settings with validation
  static async updateSettings(driverId: string, data)
    validates: working hours, service area, payment method

  // Vehicle operations
  static async createVehicle(driverId: string, vehicle)
  static async updateVehicle(vehicleId: string, vehicle)
  static async deleteVehicle(vehicleId: string)
    validates: plate number format, year, capacity

  // Document operations
  static async uploadDocument(driverId: string, type, file)
  static async getDocuments(driverId: string)
}
```

### 2. DriverAdminService

Encapsulates business logic untuk admin operations:

```typescript
class DriverAdminService {
  // Fetch drivers dengan filter & pagination
  static async getDriversWithFilters(filters: DriverFilters)
    returns { drivers, total, hasMore }
    supports: status, registration_status, search, sort, pagination

  // Get statistics
  static async getDriverStatistics()
    returns { total_drivers, active_drivers, pending_verification, etc. }

  // Get single driver detail
  static async getDriverDetail(driverId: string)
    returns { profile, vehicles, rides, documents }

  // Calculate earnings
  static async getDriverEarnings(driverId: string)
    returns { totalEarnings, completedRides, dailyEarnings, rides[] }

  // Get activity log
  static async getDriverActivityLog(driverId: string, limit)
    returns [ rides with details ]

  // Verification operations
  static async updateVerificationStatus(driverId: string, status, reason?)
  static async suspendDriver(driverId: string)
  static async reactivateDriver(driverId: string)
}
```

### 3. DriverProfileRepository

Data access layer yang handle database queries:

```typescript
class DriverProfileRepository {
  // Read operations
  static async getProfileByUserId(userId: string): DriverProfile
  static async getSettings(driverId: string): DriverSettings
  static async getVehicles(driverId: string): Vehicle[]
  static async getDocuments(driverId: string): DriverDocument[]

  // Write operations
  static async updateProfile(driverId: string, profile): DriverProfile
  static async updateSettings(driverId: string, settings): DriverSettings
  static async createVehicle(vehicle): Vehicle
  static async updateVehicle(vehicleId: string, vehicle): Vehicle
  static async deleteVehicle(vehicleId: string): void
}
```

---

## Security & RBAC

### 1. Role Definitions (rbac.ts)

```typescript
type Role = 'admin' | 'moderator' | 'user';

const ROLE_PERMISSIONS = {
  admin: [
    'admin:dashboard:view',
    'user:manage',
    'driver:manage',
    'ride:manage',
    'payment:manage',
    'shuttle:manage',
    'hotel:manage',
    'settings:manage'
  ],
  moderator: [ // driver role
    'ride:read',
    'ride:update',
    'shuttle:read',
    'shuttle:update',
    'driver:status:toggle',
    'driver:location:update',
    'wallet:view',
    'wallet:topup',
    'wallet:pay'
  ],
  user: [
    'ride:create',
    'ride:read',
    'shuttle:read',
    'hotel:read',
    'wallet:view',
    'wallet:topup',
    'wallet:pay'
  ]
};
```

### 2. Permission Checking

```typescript
// Check single permission
export function hasPermission(role: Role, permission: Permission): boolean

// Check multiple permissions (OR logic)
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean

// React component for conditional rendering
export function Can({ permission, children }: { permission: Permission; children: React.ReactNode })
  renders if user has permission
```

### 3. Row Level Security (RLS) Policies

```sql
-- Drivers can only see their own data
CREATE POLICY "Drivers see own data" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

-- Drivers can only update their own data
CREATE POLICY "Drivers update own data" ON drivers
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can see all drivers
CREATE POLICY "Admins see all drivers" ON drivers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Documents storage (private, only owner & admin)
CREATE POLICY "Users see own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins see all documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

---

## Hooks - Custom React Hooks

### 1. useAuth() - Authentication & Authorization

```typescript
export function useAuth() {
  // Returns:
  {
    user: User | null,
    session: Session | null,
    role: Role | null,
    permissions: Permission[],
    isLoading: boolean,
    isGuest: boolean,
    signIn: (email, password) => Promise,
    signUp: (email, password, name, metadata?) => Promise,
    signOut: () => Promise,
    hasPermission: (permission) => boolean
  }
  
  // Features:
  - Auto-initialize auth from stored session
  - Listen auth.onAuthStateChange
  - Fetch and cache user role
  - Derived permissions from role
  - Auto-redirect on invalid token
}
```

### 2. useDriverLocation() - GPS Tracking

```typescript
export function useDriverLocation() {
  // Automatically:
  // - Activated when isOnline = true & driverId exists
  // - Call navigator.geolocation.getCurrentPosition every 10 sec
  // - Update drivers table with current_lat, current_lng
  // - Skip duplicate positions
  // - Cleanup on unmount
  
  // Requirements:
  // - User must grant geolocation permission
  // - Works best on HTTPS or localhost
  // - Requires enableHighAccuracy: true
}
```

### 3. useIncomingRide() - Ride Notifications

```typescript
export function useIncomingRide() {
  // Automatically:
  // - Listen to Supabase realtime channel: driver-rides-{driverId}
  // - Watch for rides with status='accepted' for this driver
  // - When ride arrives:
  //   ├─ Play Web Audio chime (A5→C#6→E6)
  //   ├─ Show browser notification
  //   ├─ Show toast notification
  //   └─ Auto-update currentRideId in store
  // - Request notification permission if needed
}
```

### 4. useRBAC() - Role & Permission Checking

```typescript
export function useRBAC() {
  // Returns:
  {
    role: Role,
    permissions: Permission[],
    hasPermission: (permission: Permission) => boolean,
    hasAnyPermission: (permissions: Permission[]) => boolean,
    hasAllPermissions: (permissions: Permission[]) => boolean
  }
}

// Component for conditional rendering
export function Can({ permission, children }) {
  // Renders children only if user has permission
}
```

---

## Performance & Optimization

### 1. Code Splitting by Route

```typescript
// React Router lazy loading
const pages = {
  Home: lazy(() => import('@/pages/Index')),
  DriverDashboard: lazy(() => import('@/pages/driver/DriverDashboard')),
  AdminDrivers: lazy(() => import('@/pages/admin/AdminDrivers')),
  // ... lazyLoad other pages
}

// Only load when route is visited
```

### 2. Query Optimization

```typescript
// Stale time to prevent unnecessary refetches
useQuery({
  queryKey: ['driver-profile', userId],
  queryFn: ...,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
})

// Pagination to prevent loading too much data
getDriversWithFilters({ limit: 20, offset: 0 })

// Only fetch when needed
enabled: !!userId
```

### 3. Location Updates

```typescript
// Update every 10 seconds (not too frequent)
setInterval(updateLocation, 10000)

// Skip duplicate positions
if (lastPos.current?.lat === lat && lastPos.current?.lng === lng) return;
```

---

## Workflow Ringkasan - Complete Driver Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│            COMPLETE DRIVER LIFECYCLE WORKFLOW                │
└─────────────────────────────────────────────────────────────┘

PHASE 1: RECRUITMENT & ONBOARDING
├─ Driver visits /driver/auth
├─ Fills registration form (email, password, phone, license)
├─ Backend creates driver record (status: offline, is_verified: false)
├─ Email verification sent
├─ Email clicked → Session restored
├─ Auto-navigate to /driver/profile
└─ Driver completes profile setup

PHASE 2: PROFILE SETUP & VERIFICATION
├─ Tab 1: Basic Information
│   ├─ Enter personal & license details
│   ├─ Validation: License format, age >= 18
│   └─ Save to drivers table
│
├─ Tab 2: Working Hours & Preferences
│   ├─ Set availability (days & hours)
│   ├─ Define service area (radius)
│   ├─ Payment preferences
│   └─ Save to driver_settings table
│
├─ Tab 3: Vehicles & Documents
│   ├─ Add vehicle (plate, model, type, capacity)
│   ├─ Upload documents (KTP, SIM, STNK)
│   ├─ Store URLs in drivers table
│   └─ driver_documents records created with status: pending
│
└─ Driver's registration_status = 'pending'

PHASE 3: ADMIN VERIFICATION
├─ Admin navigates to /admin/drivers
├─ Reviews driver list with statistics
├─ Clicks driver row to open detail modal
├─ Reviews all 5 tabs (Overview, Documents, Vehicles, Earnings, Activity)
├─ Documents tab shows KTP, SIM, STNK with preview & status
├─ Options:
│   ├─ ✅ APPROVE
│   │   ├─ registration_status = 'approved'
│   │   ├─ is_verified = true
│   │   ├─ Send "Approved" email
│   │   └─ Driver can now accept rides
│   │
│   ├─ ❌ REJECT (with reason)
│   │   ├─ registration_status = 'rejected'
│   │   ├─ rejection_reason stored
│   │   ├─ Send "Rejected" email with reason
│   │   └─ Driver can resubmit after correction
│   │
│   └─ ⏸️ SUSPEND
│       ├─ status = 'offline'
│       ├─ isOnline cleared
│       └─ Driver can request reactivation
│
└─ Admin can also manage driver status, suspend, reactivate

PHASE 4: DAILY OPERATIONS (DRIVER)
├─ MORNING: Go Online
│   ├─ Check dashboard (/driver)
│   ├─ Click online toggle
│   ├─ status = 'available'
│   ├─ Start location tracking (every 10 sec)
│   └─ Start listening for incoming rides
│
├─ THROUGHOUT DAY: Accept & Complete Rides
│   ├─ Ride arrives via realtime
│   ├─ Accept ride (status = 'accepted')
│   ├─ Navigate to /driver/ride
│   ├─ View map with pickup & dropoff
│   ├─ Click "Mulai Perjalanan" (status = 'in_progress')
│   ├─ Drive to dropoff
│   ├─ Click "Selesai"
│   │   ├─ Call /complete-ride edge function
│   │   ├─ Create ride_earnings record
│   │   ├─ Update driver.total_earnings
│   │   └─ Update driver rating (if rated)
│   └─ Return to /driver dashboard
│
├─ EVENING: Review & Earnings
│   ├─ Check /driver/history (all completed rides)
│   ├─ Check /driver/earnings (analytics & chart)
│   ├─ Check /driver/wallet (balance & withdrawal)
│   └─ Go offline (status = 'offline')
│
└─ NEXT DAY: Repeat cycle

PHASE 5: ONGOING ADMIN MONITORING (ADMIN)
├─ /admin/drivers
│   ├─ Monitor driver counts (total, active, pending)
│   ├─ Average rating across all drivers
│   ├─ Filter by status/registration status
│   ├─ Search by name/phone/email
│   └─ Open driver detail for deep analysis
│
├─ /admin/rides
│   ├─ Monitor ride metrics & status
│   ├─ Track problematic rides
│   └─ Investigate cancellations
│
├─ /admin/withdrawals
│   ├─ Process driver withdrawal requests
│   ├─ Verify bank details
│   ├─ Approve/reject withdrawals
│   └─ Track payment status
│
└─ Generate reports & analytics

PHASE 6: INACTIVE / SUSPENSION
├─ If driver not active for 30 days:
│   └─ Auto-suspend account (optional policy)
│
├─ If violation detected:
│   ├─ Admin suspends driver
│   ├─ Send suspension notice email
│   └─ Driver must contact support to reactivate
│
└─ Driver can re-verify and resume operations
```

---

## Conclusion

PYU-GO adalah platform ride-sharing yang comprehensive dengan:

✅ **Robust multi-role system** (User, Driver, Admin)
✅ **Complete driver lifecycle** (Registration → Verification → Operations)
✅ **Real-time features** (Location tracking, Ride notifications)
✅ **Admin oversight** (Driver management, Verification, Earnings tracking)
✅ **Security** (RLS policies, role-based permissions, encrypted storage)
✅ **Scalability** (Supabase backend, React Query caching, lazy loading)

Driver Management Flow adalah tulang punggung aplikasi yang memastikan driver quality dan platform trust.
