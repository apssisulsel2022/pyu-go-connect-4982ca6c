# Eksplorasi Komprehensif: Sistem Driver pyu-go-connect

**Tanggal**: 13 April 2026  
**Status**: Analisis Lengkap

---

## 📋 Daftar Isi

1. [Struktur Aplikasi Keseluruhan](#1-struktur-aplikasi-keseluruhan)
2. [Technology Stack](#2-technology-stack)
3. [Driver Management Flow (End-to-End)](#3-driver-management-flow-end-to-end)
4. [Komponen Utama Driver](#4-komponen-utama-driver)
5. [Database Schema & RLS](#5-database-schema--rls)
6. [API Endpoints & Integrasi](#6-api-endpoints--integrasi)
7. [Workflow Visualisasi](#7-workflow-visualisasi)

---

## 1. STRUKTUR APLIKASI KESELURUHAN

### 1.1 Arsitektur Aplikasi (Multi-Platform)

```
pyu-go-connect (Monorepo)
├── Frontend Web (React + TypeScript + Vite)
│   ├── User App (Pengguna reguler & rider)
│   └── Driver Dashboard (Driver-specific UI)
├── Backend (Supabase)
│   ├── PostgreSQL Database
│   ├── Auth System
│   ├── RLS Policies
│   ├── Real-time Subscriptions
│   └── Edge Functions
├── Driver Mobile App (Flutter)
│   ├── Android
│   ├── iOS
│   └── Web support
└── Deployment
    └── Vercel (Frontend)
```

### 1.2 Integrasi Utama Antar Komponen

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  React Frontend (User & Driver Dashboard)                   │
│  ├── WebSocket (Real-time location tracking)              │
│  ├── REST API (Supabase JS Client)                       │
│  └── Auth (Supabase Auth)                                 │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Backend                                           │
│  ├── PostgreSQL (Data persistence)                         │
│  ├── Auth Module (JWT tokens)                              │
│  ├── Real-time (PostgreSQL changes)                        │
│  ├── Storage (Document uploads)                            │
│  └── Edge Functions (Payment, assignments)                 │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│ Driver App   ││ Third-party  ││ Mobile Apps  │
│ (Flutter)    ││ Services     ││ (Riders)     │
│              ││              ││              │
│ Supabase     ││ Firebase     ││ Supabase JS  │
│ Flutter SDK  ││ Messaging    ││ Client       │
└──────────────┘└──────────────┘└──────────────┘
```

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend (React)

```json
{
  "core": {
    "React": "18.3.1",
    "TypeScript": "5.x",
    "Vite": "Latest",
    "React Router": "6.30.1",
    "React Query": "@tanstack/react-query 5.83.0"
  },
  "ui": {
    "shadcn/ui": "Custom components",
    "Radix UI": "Multiple components",
    "Tailwind CSS": "3.x with animations",
    "Lucide Icons": "React icon library"
  },
  "utilities": {
    "React Hook Form": "7.61.1",
    "Zod": "3.25.76 (validation)",
    "Zustand": "5.0.12 (state management)",
    "Date-fns": "3.6.0",
    "i18next": "26.0.4 (i18n)",
    "React Leaflet": "4.2.1 (maps)"
  },
  "backend": {
    "Supabase JS": "2.103.0"
  }
}
```

### 2.2 Backend (Supabase)

| Komponen | Teknologi |
|----------|-----------|
| Database | PostgreSQL 15+ |
| Auth | Supabase Auth (JWT) |
| Real-time | PostgreSQL Listen/Notify |
| Storage | S3-compatible object storage |
| Edge Functions | Deno Runtime |
| Vector DB | pgvector (optional) |

### 2.3 Mobile (Flutter Driver App)

```yaml
dependencies:
  supabase_flutter: "2.8.2"        # Supabase integration
  flutter_riverpod: "2.5.1"        # State management
  geolocator: "13.0.1"             # Location services
  google_maps_flutter: "2.10.0"    # Maps
  firebase_core: "3.1.0"           # Push notifications
  firebase_messaging: "15.0.3"
  flutter_local_notifications: "17.1.2"
  google_fonts: "6.2.1"            # Typography
```

---

## 3. DRIVER MANAGEMENT FLOW (END-TO-END)

### 3.1 Driver Registration & Onboarding Flow

#### Step 1: Registration (Sign-up)
```
User Input
  ↓
Email + Password → Supabase Auth
  ↓
Trigger: on_auth_user_created()
  ├─ Create public.profiles record
  ├─ Assign default role (user)
  └─ Initialize user_settings
  ↓
Driver Registration Form
  ├─ Full Name
  ├─ Phone Number
  ├─ License Number (SIM)
  └─ Date of Birth
```

**File**: [src/pages/driver/DriverAuth.tsx](src/pages/driver/DriverAuth.tsx)

**React Component Flow**:
```typescript
// Input fields dalam form
- email (unique)
- password (encrypted by Supabase)
- fullName (stored in profiles)
- phone (stored in drivers)
- licenseNumber (stored in drivers)

// Trigger:
await signUp(email, password, fullName, {
  phone,
  license_number: licenseNumber,
  isDriver: true,
});
```

#### Step 2: Driver Profile Creation

Ketika driver pertama kali login, sistem membuat record di tabel `drivers`:

```sql
INSERT INTO public.drivers (
  user_id, full_name, phone, license_number, 
  status, rating, created_at
) VALUES (...)
ON CONFLICT DO NOTHING;
```

**Trigger Function**: `handle_new_user()`
- Membuat profile otomatis di `public.profiles`
- Set status awal: `offline`
- Set rating awal: `5.0`

#### Step 3: Document Verification

Driver diminta upload dokumen untuk verifikasi:

| Dokumen | Tipe | Status | Catatan |
|---------|------|--------|---------|
| KTP | `ktp` | pending/verified/rejected/expired | Identitas nasional |
| SIM | `sim` | pending/verified/rejected/expired | License susir (SIM) |
| STNK | `stnk` | pending/verified/rejected/expired | Tanda registrasi kendaraan |
| Insurance | `insurance` | pending/verified/rejected/expired | Asuransi kendaraan |

**Storage**: Media disimpan di bucket `documents` (private, encrypted)

```typescript
// Upload endpoint
PUT /storage/v1/object/documents/{user_id}/{document_type}
```

**Tabel**: `public.driver_documents`
```sql
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  document_type TEXT CHECK (...), -- sim, ktp, stnk, insurance
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  expiry_date DATE,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  ...
);
```

#### Step 4: Vehicle Registration

```typescript
// POST /api/driver/vehicles
{
  plate_number: "B 123456 CD",
  vehicle_type: "car|bike|shuttle",
  model: "Toyota Avanza",
  color: "Silver",
  capacity: 4,
  year: 2020
}
```

**Validasi** (DriverProfileService):
- Plate number format: alphanumeric dengan spasi standard Indonesia
- Year: 1900 - current year + 1
- Capacity: > 0

### 3.2 Driver Authentication & Authorization

#### Auth Flow

```
1. Login/Sign-up
   └─ Supabase Auth (email/password)
   
2. Session Created
   ├─ JWT Token (access_token + refresh_token)
   ├─ Expiry: 1 hour (access), 7 days (refresh)
   └─ Stored in localStorage

3. Fetch User Role
   └─ Query: user_roles 
   └─ Roles: admin, moderator (driver), user

4. Set RBAC Context
   └─ Permission check untuk setiap aksi
```

**Hook Implementation**: [src/hooks/useAuth.ts](src/hooks/useAuth.ts)

```typescript
// Recovery from URL (OAuth redirect)
const { data: { session: urlSession } } = 
  await supabase.auth.getSession();

// Auth state subscription
const { data: { subscription } } = 
  supabase.auth.onAuthStateChange(
    (event, sessionData) => {
      // Handle: SIGNED_IN, SIGNED_OUT, etc.
    }
  );
```

#### RBAC (Role-Based Access Control)

**Roles**:
```typescript
type Role = "admin" | "moderator" | "user";

// Moderator = Driver role dengan permissions:
- "ride:read"
- "ride:update"
- "shuttle:read"
- "driver:status:toggle"
- "driver:location:update"
- "wallet:view"
- "wallet:pay"
```

**Permission Check**:
```typescript
const hasPermission = (userRole: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};
```

### 3.3 Driver Location Tracking & Real-time Updates

#### Location Update Flow

**Trigger**: Ketika driver toggle "Online" status

```typescript
// Hook: useDriverLocation()
// 1. GPS polling setiap 10 detik (enableHighAccuracy: true)
// 2. Update ke Supabase jika lokasi berubah
// 3. Update fields: current_lat, current_lng

navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const { lat, lng } = pos.coords;
    await supabase
      .from("drivers")
      .update({ current_lat: lat, current_lng: lng })
      .eq("id", driverId);
  }
);
```

**Interval**: `window.setInterval(updateLocation, 10000)`

#### Real-time Subscription (Untuk Tracking Users)

**Hook**: [src/hooks/useDriverTracking.ts](src/hooks/useDriverTracking.ts)

```typescript
// User/Rider subscribe to available drivers
const channel = supabase
  .channel("driver-locations")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "drivers" },
    (payload) => {
      // Filter hanya drivers dengan status "available" 
      // dan koordinat valid
      if (payload.new.status === "available" && 
          payload.new.current_lat && payload.new.current_lng) {
        // Update driver list
      }
    }
  )
  .subscribe();
```

**Database Event**: Diaktifkan via `ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;`

### 3.4 Driver Status Management

#### Status Enum
```sql
CREATE TYPE driver_status AS ENUM 
  ('available', 'busy', 'offline');
```

#### Status Transitions

| From → To | Trigger | Action |
|-----------|---------|--------|
| offline → available | Driver toggle "Go Online" | Start GPS tracking |
| available → busy | Accept ride request | Update driver status |
| busy → available | Complete ride | Update driver status + clear ride |
| available → offline | Driver logout/toggle offline | Stop GPS tracking |

**Implementation**:

```typescript
// Toggle Online Status
const setOnline = async (onlineStatus: boolean) => {
  const newStatus = onlineStatus ? 'available' : 'offline';
  
  await supabase
    .from("drivers")
    .update({ status: newStatus })
    .eq("id", driverId);
    
  if (onlineStatus) {
    useDriverLocation(); // Start tracking
  }
};
```

#### Location Service Integration

**Android/iOS**: menggunakan `geolocator` package (Flutter)

```dart
// Platform service untuk background location updates
Future<Position> getCurrentPosition() =>
  Geolocator.getCurrentPosition();

// Listen untuk location changes
Geolocator.getPositionStream(
  locationSettings: const LocationSettings(
    accuracy: LocationAccuracy.bestForNavigation,
  ),
).listen((Position position) {
  // Update to Supabase
});
```

### 3.5 Ride Request & Acceptance Workflow

#### Request Flow

```
1. Rider membuat ride request
   └─ INSERT into rides (status: 'pending')

2. System mencari available drivers
   ├─ Query: drivers 
   │  where status = 'available' 
   │  AND current_lat/lng ada
   ├─ Radius filter: based on driver_settings.service_area_radius_km
   └─ Optional: Match vehicle type preference

3. Push Notification ke Driver
   ├─ Via Firebase Cloud Messaging (FCM)
   ├─ Audio + Visual + Browser Notification
   └─ Auto-dismiss setelah 30 detik (timeout)
```

**Real-time Listener** (Driver App):

```typescript
// Hook: useIncomingRide()

const channel = supabase
  .channel(`driver-rides-${driverId}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "rides",
      filter: `driver_id=eq.${driverId}`,
    },
    (payload) => {
      const ride = payload.new;
      if (ride.status === "accepted") {
        // Show notification
        playNotificationSound(); // Audio (880Hz, 1108Hz, 1320Hz)
        showBrowserNotification("New Ride!", ride.pickup_address);
      }
    }
  )
  .subscribe();
```

#### Acceptance Flow

```
1. Driver click "Accept Ride" button
   └─ RideRepository.acceptRide(rideId, driverId)

2. Update transaction:
   ├─ UPDATE rides SET status='accepted', driver_id={driverId}
   └─ UPDATE drivers SET status='busy'

3. Realtime event
   ├─ Rider notified: "Driver accepted your ride"
   └─ Driver gets ride details (pickup, dropoff, fare)

4. Navigation to pickup location
   └─ Google Maps integration (Flutter)
```

**Acceptance Logic**:

```typescript
static async acceptRide(rideId: string, driverId: string) {
  // Transaction-like update
  await supabase
    .from('rides')
    .update({
      status: RideStatus.accepted.name,
      driver_id: driverId,
    })
    .eq('id', rideId);
  
  // Update driver status
  await supabase
    .from('drivers')
    .update({ status: 'busy' })
    .eq('id', driverId);
}
```

### 3.6 Driver Profile & Verification

#### Complete Driver Profile Structure

| Field | Type | Source | Verified |
|-------|------|--------|----------|
| id | UUID | Generated | ✓ |
| user_id | UUID | Auth | ✓ |
| full_name | TEXT | Profile | ✗ |
| phone | TEXT | Profile | ✗ |
| license_number | TEXT | Input | Audit trail |
| sim_expiry_date | DATE | Document | Audit trail |
| gender | ENUM | Profile | ✗ |
| date_of_birth | DATE | Profile | Age validation |
| address | TEXT | Profile | ✗ |
| avatar_url | TEXT | Storage bucket | ✗ |
| status | ENUM | System | ✓ |
| rating | NUMERIC(2,1) | Rides (avg) | ✓ |
| is_verified | BOOLEAN | Admin | ✓ |
| registration_status | ENUM | Admin | ✓ |

**Registration Status Enum**:
```sql
CREATE TYPE registration_status AS ENUM 
  ('pending', 'approved', 'rejected');
```

#### Profile Sync Mechanism

**Trigger**: `sync_profile_to_driver()`

```sql
-- Ketika profiles table di-update
UPDATE public.drivers
SET 
  full_name = NEW.full_name,
  phone = NEW.phone,
  avatar_url = NEW.avatar_url,
  gender = NEW.gender,
  updated_at = now()
WHERE user_id = NEW.user_id;
```

#### Driver Settings (Preferences)

```typescript
interface DriverSettings {
  working_hours_enabled: boolean;
  working_hours_start: string;      // "08:00"
  working_hours_end: string;        // "20:00"
  available_monday: boolean;
  available_tuesday: boolean;
  // ... (hari lainnya)
  service_area_radius_km: number;   // Max 50-100 km
  auto_accept_rides: boolean;
  auto_accept_timeout_seconds: number; // Min 5 detik
  preferred_payment_method: "cash" | "wallet" | "card";
  emergency_contact_name: string;
  emergency_contact_phone: string;
}
```

**Table**: `public.driver_settings`

---

## 4. KOMPONEN UTAMA DRIVER

### 4.1 React Frontend Components

#### Directory Structure
```
src/
├── components/driver/
│   └── profile/
│       ├── BasicInfoForm.tsx          # Personal info editing
│       ├── DocumentVerification.tsx    # Document upload UI
│       ├── ProfilePhoto.tsx            # Avatar upload
│       ├── SecuritySettings.tsx        # Security/2FA
│       ├── ServiceSettings.tsx         # Preferences
│       └── VehicleInfo.tsx             # Vehicle management
├── pages/driver/
│   ├── DriverAuth.tsx                  # Login/Signup form
│   ├── DriverDashboard.tsx             # Main dashboard
│   ├── DriverActiveRide.tsx            # Current ride tracking
│   ├── DriverEarnings.tsx              # Revenue dashboard
│   ├── DriverHistory.tsx               # Ride history
│   ├── DriverLayout.tsx                # Layout wrapper
│   ├── DriverProfile.tsx               # Profile management
│   ├── DriverShuttle.tsx               # Shuttle management
│   ├── DriverWallet.tsx                # Wallet/payment
│   └── tabs/
│       └── (Tab components)
└── hooks/
    ├── useAuth.ts                      # Auth state management
    ├── useDriverLocation.ts            # GPS tracking
    ├── useDriverTracking.ts            # Track other drivers (admin)
    └── useIncomingRide.ts              # Listen for ride requests
```

#### Component Details

**1. DriverDashboard.tsx** - Main Hub
```typescript
Features:
- Online/Offline toggle (Switch component)
- Current ride status
- Earnings summary (TotalEarnings)
- Rating display
- Vehicle selector
- Real-time location map (Leaflet)
- Incoming ride listener

States:
- isOnline (from driverId store)
- currentRideId (active ride)
- driver (profile data)
- vehicles (available vehicles)
```

**2. DriverAuth.tsx** - Authentication
```typescript
Flow:
- Toggle between Login/Sign-up
- Validation: email, password, phone, license

Sign-up specific fields:
- fullName (required)
- phone (required)
- licenseNumber (required)

Styling:
- Emerald theme (emerald-600)
- Rounded cards (rounded-3xl)
- Custom header with Car icon
```

**3. DocumentVerification.tsx** - Doc Upload
```typescript
Supported Docs:
- KTP (Kartu Tanda Penduduk)
- SIM (License)
- STNK (Vehicle registration)
- Insurance
- Custom documents

Upload flow:
1. Select file (PDF/Image)
2. Upload to storage.buckets.documents
3. Submit for verification
4. Status: pending → verified/rejected

Storage Path:
/documents/{driver_id}/{document_type}/{filename}
```

#### React Query Integration

```typescript
// Fetch driver profile
const { data: driver, isLoading } = useQuery({
  queryKey: ["driver-profile", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!user,
});

// Update mutation
const updateVehicleMutation = useMutation({
  mutationFn: async (vehicleId: string) => {
    return supabase
      .from("drivers")
      .update({ current_vehicle_id: vehicleId })
      .eq("id", driverId!);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["driver-profile"]
    });
  }
});
```

### 4.2 Flutter Driver App Structure

#### Directory Organization
```
driver_app/lib/features/
├── auth/
│   └── domain/
│       └── driver.dart                 # Driver model definition
├── ride/
│   ├── domain/
│   │   ├── ride_model.dart            # Ride data model
│   │   └── ride_repository.dart       # Ride business logic
│   └── presentation/
│       └── (UI screens)
└── (Other features)
```

#### Domain Models

**1. Driver Model** (`driver.dart`)
```dart
class Driver {
  final String id;
  final String? userId;
  final String fullName;
  final String phone;
  final String? licenseNumber;
  final String status;              // available, busy, offline
  final double? currentLat;
  final double? currentLng;
  final double rating;

  factory Driver.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() { ... }
}
```

**2. Ride Model** (`ride_model.dart`)
```dart
enum RideStatus {
  pending,
  accepted,
  inProgress,
  completed,
  cancelled,
}

class RideModel {
  final String id;
  final String riderId;
  final String? driverId;
  final double pickupLat;
  final double pickupLng;
  final String? pickupAddress;
  final double dropoffLat;
  final double dropoffLng;
  final String? dropoffAddress;
  final double fare;
  final double distanceKm;
  final RideStatus status;
  final String serviceType;           // ride, bike, shuttle
  final DateTime createdAt;
}
```

#### Repository Pattern

**RideRepository** (`ride_repository.dart`)
```dart
class RideRepository {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Accept incoming ride
  Future<void> acceptRide(String rideId, String driverId) async {
    await _supabase
        .from('rides')
        .update({
          'status': RideStatus.accepted.name,
          'driver_id': driverId,
        })
        .eq('id', rideId);
    
    // Also update driver status
    await _supabase
        .from('drivers')
        .update({'status': 'busy'})
        .eq('id', driverId);
  }

  // Complete ride (trigger payment)
  Future<void> completeRide(String rideId) async {
    await _supabase.functions.invoke('complete-ride', 
      body: {'ride_id': rideId}
    );
  }

  // Watch incoming rides realtime
  Stream<List<RideModel>> watchIncomingRides(String driverId) {
    return _supabase
        .from('rides')
        .stream(primaryKey: ['id'])
        .eq('driver_id', driverId)
        .order('created_at')
        .map((data) => data.map((json) => RideModel.fromJson(json)).toList());
  }
}
```

#### State Management (Riverpod)

```dart
// Likely structure (based on pubspec.yaml dependency):
final driverProvider = StateNotifierProvider<DriverNotifier, Driver?>(...);
final ridesStreamProvider = StreamProvider<List<RideModel>>(...);
final locationProvider = StreamProvider<Position>(...);
```

### 4.3 Services & Repositories

#### TypeScript Services

**1. DriverProfileService.ts**

```typescript
class DriverProfileService {
  // Get complete profile with settings & vehicles
  static async getDriverComplete(userId: string) {
    const profile = await DriverProfileRepository.getProfileByUserId(userId);
    const [settings, vehicles, documents] = await Promise.all([
      DriverProfileRepository.getSettings(profile.id),
      DriverProfileRepository.getVehicles(profile.id),
      DriverProfileRepository.getDocuments(profile.id),
    ]);
    return { profile, settings, vehicles, documents };
  }

  // Update profile with validation
  static async updateBasicInfo(driverId: string, data: Partial<DriverProfile>) {
    // Validate license format
    if (data.license_number && !this.isValidLicenseNumber(data.license_number)) {
      throw new Error("Invalid license number format");
    }
    
    // Validate age >= 18
    if (data.date_of_birth) {
      const age = this.calculateAge(new Date(data.date_of_birth));
      if (age < 18) throw new Error("Driver must be at least 18 years old");
    }

    return DriverProfileRepository.updateProfile(driverId, data);
  }

  // Update vehicle with validation
  static async createVehicle(driverId: string, vehicle: Partial<Vehicle>) {
    // Validate plate format (e.g., "B 123456 CD")
    if (!this.isValidPlateNumber(vehicle.plate_number)) {
      throw new Error("Invalid plate number format");
    }
    
    // Validate vehicle year
    if (vehicle.year) {
      const currentYear = new Date().getFullYear();
      if (vehicle.year < 1900 || vehicle.year > currentYear + 1) {
        throw new Error("Invalid vehicle year");
      }
    }

    return DriverProfileRepository.createVehicle({
      ...vehicle,
      driver_id: driverId,
    });
  }
}
```

**2. DriverAdminService.ts**

```typescript
class DriverAdminService {
  // Get drivers with filters & pagination
  static async getDriversWithFilters(filters: DriverFilters) {
    const { status, registration_status, search, sortBy, limit, offset } = filters;

    let query = supabase.from("drivers").select(`
      id, full_name, phone, email, avatar_url, status, 
      rating, registration_status, vehicles(count), rides(count)
    `, { count: "exact" });

    // Apply filters
    if (status) query = query.eq("status", status);
    if (registration_status) query = query.eq("registration_status", registration_status);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,...`);
    }

    // Sorting
    if (sortBy === "rating") {
      query = query.order("rating", { ascending: false });
    }

    const { data, count } = await query.range(offset, offset + limit - 1);

    return {
      drivers: data,
      total: count,
      hasMore: count > offset + limit,
    };
  }

  // Get driver statistics
  static async getDriverStatistics(): Promise<DriverStatistics> {
    // Query untuk aggregate data
  }

  // Approve/Reject registration
  static async updateRegistrationStatus(
    driverId: string, 
    status: "approved" | "rejected",
    reason?: string
  ) {
    // Update registration_status
  }
}
```

#### DriverProfileRepository.ts (Data Access)

```typescript
export class DriverProfileRepository {
  // Get profile by user ID
  static async getProfileByUserId(userId: string): Promise<DriverProfile | null> {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  // Get driver settings (with error handling for non-existent table)
  static async getSettings(driverId: string): Promise<DriverSettings | null> {
    try {
      const { data, error } = await supabase
        .from("driver_settings")
        .select("*")
        .eq("driver_id", driverId)
        .maybeSingle();
      if (error?.code === 'PGRST116' || error?.code === '42P01') {
        return null; // Table doesn't exist
      }
      return data;
    } catch (error) {
      return null;
    }
  }

  // Get all vehicles for driver
  static async getVehicles(driverId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", driverId);
    if (error) throw error;
    return data || [];
  }

  // Get driver documents
  static async getDocuments(driverId: string): Promise<DriverDocument[]> {
    const { data, error } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", driverId);
    if (error) throw error;
    return data || [];
  }

  // Update profile
  static async updateProfile(
    driverId: string, 
    profile: Partial<DriverProfile>
  ): Promise<DriverProfile> {
    const { data, error } = await supabase
      .from("drivers")
      .update(profile)
      .eq("id", driverId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

---

## 5. DATABASE SCHEMA & RLS

### 5.1 Main Tables

#### `public.drivers` - Core Driver Table

```sql
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  license_number TEXT UNIQUE,
  sim_expiry_date DATE,
  sim_verified_at TIMESTAMPTZ,
  sim_url TEXT,
  ktp_number TEXT,
  ktp_url TEXT,
  vehicle_stnk_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', null)),
  date_of_birth DATE,
  address TEXT,
  
  -- Status & Tracking
  status driver_status NOT NULL DEFAULT 'offline',
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  current_vehicle_id UUID REFERENCES public.vehicles(id),
  
  -- Rating & Verification
  rating NUMERIC(2,1) DEFAULT 5.0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  registration_status registration_status DEFAULT 'pending',
  
  -- Preferences
  avatar_url TEXT,
  prefers_bike BOOLEAN NOT NULL DEFAULT true,
  prefers_bike_women BOOLEAN NOT NULL DEFAULT false,
  prefers_car BOOLEAN NOT NULL DEFAULT true,
  
  -- Emergency
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Verification
  background_check_status TEXT,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_current_location ON drivers(current_lat, current_lng) 
  WHERE status = 'available';
```

#### `public.driver_settings` - Driver Preferences

```sql
CREATE TABLE public.driver_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES public.drivers(id) ON DELETE CASCADE,
  
  -- Working Hours
  working_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  working_hours_start TIME,
  working_hours_end TIME,
  available_monday BOOLEAN DEFAULT true,
  available_tuesday BOOLEAN DEFAULT true,
  available_wednesday BOOLEAN DEFAULT true,
  available_thursday BOOLEAN DEFAULT true,
  available_friday BOOLEAN DEFAULT true,
  available_saturday BOOLEAN DEFAULT true,
  available_sunday BOOLEAN DEFAULT false,
  
  -- Service Area
  service_area_radius_km INTEGER NOT NULL DEFAULT 50 
    CHECK (service_area_radius_km > 0),
  
  -- Auto-Accept
  auto_accept_rides BOOLEAN NOT NULL DEFAULT false,
  auto_accept_timeout_seconds INTEGER NOT NULL DEFAULT 10 
    CHECK (auto_accept_timeout_seconds >= 5),
  
  -- Payment
  preferred_payment_method TEXT NOT NULL DEFAULT 'cash' 
    CHECK (preferred_payment_method IN ('cash', 'wallet', 'card')),
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.vehicles` - Vehicle Management

```sql
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  
  plate_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  model TEXT,
  color TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  year INTEGER,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
```

#### `public.driver_documents` - Document Verification

```sql
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL CHECK (document_type IN ('sim', 'ktp', 'stnk', 'insurance', 'other')),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  expiry_date DATE,
  
  -- Verification Audit
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(driver_id, document_type)
);
```

#### `public.vehicle_documents` - Vehicle Doc Verification

```sql
CREATE TABLE public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL CHECK (document_type IN ('stnk', 'insurance', 'tax_paid')),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expiry_date DATE,
  
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `public.ride_ratings` - Rating System

```sql
CREATE TABLE public.ride_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES auth.users(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(ride_id)
);

-- Trigger to update driver's average rating
CREATE TRIGGER on_ride_rating_inserted
AFTER INSERT ON public.ride_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_driver_average_rating();
```

#### `public.rides` - Main Ride Table

```sql
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  rider_id UUID NOT NULL REFERENCES auth.users(id),
  driver_id UUID REFERENCES public.drivers(id),
  
  -- Location
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT,
  
  -- Fare & Distance
  fare NUMERIC(12,2),
  distance_km NUMERIC(8,2),
  
  status ride_status NOT NULL DEFAULT 'pending',
  service_type TEXT DEFAULT 'car', -- car, bike, shuttle
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
```

### 5.2 RLS (Row Level Security) Policies

#### Drivers Table

```sql
-- Everyone can view drivers (needed for taxi search)
CREATE POLICY "Drivers viewable by everyone" ON public.drivers 
  FOR SELECT USING (true);

-- Only admins can manage all drivers
CREATE POLICY "Admins can manage drivers" ON public.drivers 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Driver can update their own profile
CREATE POLICY "Drivers can update own profile" ON public.drivers
  FOR UPDATE USING (user_id = auth.uid());
```

#### Driver Settings

```sql
-- Drivers can view/update own settings
CREATE POLICY "Drivers can manage own settings" ON public.driver_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );
```

#### Driver Documents

```sql
-- Driver can view/manage own documents
CREATE POLICY "Drivers can manage own documents" ON public.driver_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Admin can view all documents
CREATE POLICY "Admins can view all documents" ON public.driver_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

#### Vehicles

```sql
-- Everyone can view vehicles (for ride filtering)
CREATE POLICY "Vehicles viewable by everyone" ON public.vehicles 
  FOR SELECT USING (true);

-- Only driver can update their vehicles
CREATE POLICY "Drivers can manage own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Drivers can update own vehicles" ON public.vehicles
  FOR UPDATE USING (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid() LIMIT 1
    )
  );
```

#### Rides

```sql
-- Riders can view own rides
CREATE POLICY "Users can view own rides" ON public.rides 
  FOR SELECT USING (auth.uid() = rider_id);

-- Drivers can view assigned rides
CREATE POLICY "Drivers can view assigned rides" ON public.rides
  FOR SELECT USING (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Admins can view all rides
CREATE POLICY "Admins can view all rides" ON public.rides 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

#### Storage Policies

```sql
-- Documents bucket (private)
CREATE POLICY "Users can upload their own documents" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars bucket (public read)
CREATE POLICY "Public Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 5.3 Audit & Synchronization

#### Audit Logs Trigger

```sql
CREATE OR REPLACE FUNCTION public.log_driver_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs 
      (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES ('drivers', OLD.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid()::text);
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs 
      (table_name, record_id, action, new_data, changed_by)
    VALUES ('drivers', NEW.id::text, 'INSERT', to_jsonb(NEW), auth.uid()::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_driver_change
AFTER INSERT OR UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.log_driver_changes();
```

#### Profile Sync Trigger

```sql
-- When profile is updated, sync to driver
CREATE OR REPLACE FUNCTION public.sync_profile_to_driver()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.drivers
  SET 
    full_name = NEW.full_name,
    phone = NEW.phone,
    avatar_url = NEW.avatar_url,
    gender = NEW.gender,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_sync_driver
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.sync_profile_to_driver();
```

#### Rating Update Trigger

```sql
CREATE OR REPLACE FUNCTION public.update_driver_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.drivers
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.ride_ratings
    WHERE driver_id = NEW.driver_id
  )
  WHERE id = NEW.driver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ride_rating_inserted
AFTER INSERT ON public.ride_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_driver_average_rating();
```

### 5.4 Database Relationships (ER Diagram)

```
┌──────────────────────┐
│   auth.users         │
│  ─────────────────   │
│  id (PK)             │
│  email               │
│  created_at          │
└──────────┬───────────┘
           │ 1
           │
           │ N
    ┌──────▼────────────────┐
    │ public.drivers         │
    │  ──────────────────     │
    │ id (PK)                │
    │ user_id (FK, UNIQUE)   │ ◄──┐
    │ full_name              │    │
    │ phone (UNIQUE)         │    │
    │ license_number (UNIQUE)│    │
    │ status (available...)  │    │
    │ current_lat/lng        │    │
    │ rating                 │    │
    │ current_vehicle_id (FK)│    │
    └──────┬────────────────┘    │
           │                      │
       1   │   N             ┌────┘
           │◄───┴────────────┤
           │         1       │
    ┌──────▼────────────┐   │
    │ public.vehicles   │────┘
    │  ──────────────   │
    │ id (PK)           │
    │ driver_id (FK)    │ ◄──┐
    │ plate_number      │    │
    │ vehicle_type      │    │
    │ capacity          │    │
    └──────┬────────────┴────┘
           │ 1       N
           │       vehicle_documents

    ┌──────────────────┐
    │ driver_settings  │
    │ ────────────────  │
    │ id (PK)          │
    │ driver_id (FK,U) │
    │ working_hours... │
    │ service_area_km  │
    │ auto_accept      │
    └──────────────────┘

    ┌─────────────────────┐
    │ driver_documents    │
    │  ────────────────   │
    │ id (PK)             │
    │ driver_id (FK)      │
    │ document_type       │
    │ file_url (Storage)  │
    │ status              │
    │ verified_by (FK)    │
    └─────────────────────┘

    ┌─────────────────────┐
    │ vehicle_documents   │
    │  ────────────────   │
    │ id (PK)             │
    │ vehicle_id (FK)     │
    │ document_type       │
    │ file_url (Storage)  │
    │ status              │
    └─────────────────────┘

    ┌─────────────────────┐
    │ public.rides        │
    │  ────────────────   │
    │ id (PK)             │
    │ rider_id (FK)       │
    │ driver_id (FK)      │
    │ pickup_lat/lng      │
    │ dropoff_lat/lng     │
    │ status (pending...) │
    │ fare, distance_km   │
    └──────────┬──────────┘
               │ 1     N
               │◄──────┘
        ┌──────▼─────────────┐
        │ ride_ratings       │
        │  ─────────────     │
        │ id (PK)            │
        │ ride_id (FK,UNIQUE)│
        │ rider_id (FK)      │
        │ driver_id (FK)     │
        │ rating (1-5)       │
        | comment            │
        └────────────────────┘
```

---

## 6. API ENDPOINTS & INTEGRASI

### 6.1 Driver-specific API Endpoints

#### Authentication
```
POST   /auth/signup                 # Driver sign-up
POST   /auth/login                  # Driver login
POST   /auth/logout                 # Logout
POST   /auth/refresh                # Refresh JWT token
```

#### Driver Profile
```
GET    /api/driver/profile          # Get own profile
PUT    /api/driver/profile          # Update profile
GET    /api/driver/profile/complete # Full profile + settings + vehicles
POST   /api/driver/profile/avatar   # Upload avatar
```

#### Driver Status
```
PUT    /api/driver/status/{status}  # Update status (available/busy/offline)
GET    /api/driver/status           # Get current status
```

#### Location
```
PUT    /api/driver/location         # Update current GPS location
GET    /api/driver/location         # Get own location (debug)
```

#### Vehicles
```
GET    /api/driver/vehicles         # List all vehicles
POST   /api/driver/vehicles         # Create new vehicle
PUT    /api/driver/vehicles/{id}    # Update vehicle
DELETE /api/driver/vehicles/{id}    # Delete vehicle
```

#### Documents
```
POST   /api/driver/documents        # Upload document
GET    /api/driver/documents        # List all documents
PUT    /api/driver/documents/{id}   # Update document status
```

#### Settings
```
GET    /api/driver/settings         # Get preferences
PUT    /api/driver/settings         # Update preferences
```

#### Rides
```
GET    /api/driver/rides            # List my rides (history)
GET    /api/driver/rides/current    # Get current active ride
POST   /api/driver/rides/{id}/accept          # Accept ride
POST   /api/driver/rides/{id}/complete       # Complete ride
POST   /api/driver/rides/{id}/rate           # Rate rider
```

#### Admin (Driver Management)
```
GET    /api/admin/drivers                    # List all drivers (with filters)
GET    /api/admin/drivers/{id}               # Get driver details
POST   /api/admin/drivers/{id}/verify        # Approve driver
POST   /api/admin/drivers/{id}/reject        # Reject registration
GET    /api/admin/drivers/statistics         # Driver statistics
```

### 6.2 Real-time Subscriptions

#### Realtime Channels

```typescript
// 1. Driver-specific ride notifications
channel = supabase.channel(`driver-rides-${driverId}`)
  .on('postgres_changes', 
    { event: 'UPDATE', table: 'rides', filter: `driver_id=eq.${driverId}` },
    (payload) => { /* Handle ride update */ }
  )
  .subscribe();

// 2. Available drivers tracking (for riders)
channel = supabase.channel('driver-locations')
  .on('postgres_changes',
    { event: '*', table: 'drivers' },
    (payload) => { /* Update driver list */ }
  )
  .subscribe();

// 3. Driver status updates (for admin dashboard)
channel = supabase.channel('drivers-status')
  .on('postgres_changes',
    { event: 'UPDATE', table: 'drivers' },
    (payload) => { /* Update status */ }
  )
  .subscribe();
```

### 6.3 External Integrations

#### Firebase Cloud Messaging (FCM)
- Push notifications untuk incoming rides
- Background service untuk location tracking (mobile)

#### Google Maps
- Route optimization
- Distance/duration calculation
- Address geocoding

#### Payment Gateways (assumed)
- **Midtrans** / **Xendit** (Indonesia)
- Wallet integration
- Payout to driver

#### Third-party Services
- **Twilio** (SMS notifications)
- **SendGrid** (Email notifications)
- Analytics (Mixpanel, Amplitude)

---

## 7. WORKFLOW VISUALISASI

### 7.1 Complete Driver Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SIGN-UP & REGISTRATION                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Input                                                  │
│    ├─ Email                                                  │
│    ├─ Password                                               │
│    ├─ Full Name                                              │
│    ├─ Phone                                                  │
│    └─ License Number                                         │
│            │                                                 │
│            ▼                                                 │
│  Supabase Auth                                               │
│    ├─ Create auth.users record                              │
│    └─ Trigger: on_auth_user_created()                       │
│            │                                                 │
│            ▼                                                 │
│  Auto-create records                                         │
│    ├─ profiles (full_name)                                  │
│    ├─ drivers (phone, license_number, status=offline)       │
│    ├─ driver_settings (defaults)                            │
│    ├─ user_roles (role=user initially)                      │
│    └─ user_settings (defaults)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. PROFILE COMPLETION & VERIFICATION                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Driver Dashboard                                            │
│    ├─ Upload Avatar   ─► storage.avatars bucket             │
│    ├─ Personal Info                                          │
│    │   ├─ Date of Birth (validate age >= 18)               │
│    │   ├─ Gender                                            │
│    │   └─ Address                                           │
│    └─ Emergency Contact                                     │
│            │                                                 │
│            ▼                                                 │
│  Document Upload                                            │
│    ├─ KTP (ID card)    ─► storage.documents                 │
│    ├─ SIM (License)    ─► status: pending                   │
│    ├─ STNK (Vehicle reg)                                    │
│    └─ Insurance                                             │
│            │                                                 │
│            ▼                                                 │
│  Admin Review                                               │
│    ├─ Verify documents                                      │
│    ├─ Check background                                      │
│    └─ Update registration_status                            │
│        ├─ pending → approved                                │
│        └─ pending → rejected + reason                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. VEHICLE REGISTRATION                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Add Vehicle                                                │
│    ├─ Plate Number (validate format)                        │
│    ├─ Vehicle Type (car, bike, etc)                         │
│    ├─ Model & Color                                         │
│    ├─ Year (validate 1900-current)                          │
│    └─ Capacity                                              │
│            │                                                 │
│            ▼                                                 │
│  Vehicle Documents                                          │
│    ├─ STNK (registration)                                   │
│    ├─ Insurance                                             │
│    └─ Tax Certificate                                       │
│            │                                                 │
│            ▼                                                 │
│  Store in DB                                                │
│    ├─ vehicles table                                        │
│    └─ vehicle_documents table                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. GOING ONLINE & OPERATIONAL MODE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Driver Toggle "Go Online"                                  │
│    ├─ Update drivers.status → "available"                   │
│    ├─ Request browser permission (geolocation)              │
│    └─ Start GPS polling (every 10 seconds)                  │
│            │                                                 │
│            ▼                                                 │
│  Real-time Location Tracking                                │
│    ├─ navigator.geolocation.getCurrentPosition()            │
│    ├─ Update drivers.current_lat, current_lng               │
│    └─ Broadcast via realtime channel                        │
│            │                                                 │
│            ▼                                                 │
│  Available to Receive Rides                                 │
│    ├─ Listen for incoming ride requests                     │
│    ├─ Firebase push notification                            │
│    └─ Audio + Visual alert                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 5. RIDE ACCEPTANCE & COMPLETION                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Accept Ride                                                │
│    ├─ Click "Accept" button                                 │
│    ├─ Update rides.status → "accepted"                      │
│    ├─ Update drivers.status → "busy"                        │
│    └─ Get ride details (pickup, dropoff, fare)              │
│            │                                                 │
│            ▼                                                 │
│  Navigate to Pickup                                         │
│    ├─ Google Maps navigation                                │
│    ├─ Real-time location updates                            │
│    └─ Notify rider: "Driver approaching"                    │
│            │                                                 │
│            ▼                                                 │
│  Complete & Rate                                            │
│    ├─ Update rides.status → "completed"                     │
│    ├─ Process payment via edge function                     │
│    ├─ Update drivers.status → "available"                   │
│    ├─ Rider rates driver                                    │
│    └─ Update drivers.rating (average)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Real-time Communication Architecture

```
Django App (Driver Mobile)
  │
  ├─► WebSocket
  │    └─ Supabase Realtime
  │         └─ PostgreSQL LISTEN
  │              └─ drivers table changes
  │
  └─► HTTP REST
       └─ Accept/Update rides


React Dashboard (Driver Web)
  │
  ├─► Supabase JS Client
  │    ├─ Realtime subscriptions
  │    │   ├─ rides#UPDATE
  │    │   ├─ drivers#UPDATE
  │    │   └─ driver_documents#*
  │    │
  │    └─ REST queries
  │         ├─ .from('drivers').select()
  │         ├─ .from('vehicles').select()
  │         └─ .from('rides').select()
  │
  └─► Firebase Cloud Messaging
       └─ Push notifications


Rider Web App
  │
  └─► Supabase
       ├─ Search available drivers
       │  └─ drivers WHERE status='available'
       │
       ├─ Create ride request
       │  └─ INSERT into rides
       │
       └─ Watch driver location realtime
          └─ drivers LISTEN for changes
```

### 7.3 Data Flow: From Sign-up to First Ride

```
DAY 1: REGISTRATION
═════════════════════════════════════════════════════════════

T+0:00  User clicks "Daftar sebagai Driver"
        │
        ├─ Form Input:
        │   ├─ email: john@example.com
        │   ├─ password: ••••••••
        │   ├─ fullName: John Driver
        │   ├─ phone: +6281212345678
        │   └─ licenseNumber: 1234567890123
        │
        ▼ SIGN-UP REQUEST
        
        POST /auth/signup
        └─ supabase.auth.signUp({
            email, password,
            options: { data: { ... metadata ... } }
          })

T+1:00  ✓ Account Created
        │
        ├─ Trigger: on_auth_user_created()
        │   ├─ INSERT profiles
        │   ├─ INSERT drivers
        │   ├─ INSERT driver_settings
        │   ├─ INSERT user_settings
        │   └─ INSERT user_roles (role='user')
        │
        ▼ AUTO-INITIALIZED
        
        drivers table:
        ├─ id: "abc-123"
        ├─ user_id: "auth-123"
        ├─ full_name: "John Driver"
        ├─ phone: "+6281212345678"
        ├─ status: "offline"
        ├─ rating: 5.0
        ├─ is_verified: false
        ├─ registration_status: "pending"
        └─ created_at: "2026-04-13T10:30:00Z"

T+2:00  Email confirmation sent
        └─ User clicks link in email
        
        ▼ EMAIL VERIFIED


DAYS 2-5: DOCUMENTATION & VERIFICATION
═════════════════════════════════════════════════════════════

T+24:00 Driver logs in & completes profile
        │
        ├─ Upload Avatar
        │   └─ PUT /storage/avatars/auth-123/profile.jpg
        │
        ├─ Update Basic Info
        │   └─ PUT /api/driver/profile
        │      ├─ date_of_birth: "1990-01-15"
        │      ├─ gender: "male"
        │      └─ address: "Jl. Merdeka No 123, Jakarta"
        │
        ▼ Profile Synced
        
        Trigger: sync_profile_to_driver()
        └─ UPDATE drivers SET full_name, gender, avatar_url ...

T+48:00 Driver uploads documents
        │
        ├─ POST /api/driver/documents
        │   ├─ type: "ktp"
        │   ├─ file: [binary]
        │   └─ expiry_date: "2029-12-31"
        │
        ├─ Stored in storage.documents/auth-123/ktp.pdf
        │
        ├─ INSERT driver_documents
        │   ├─ id: "doc-ktp-123"
        │   ├─ document_type: "ktp"
        │   ├─ status: "pending"
        │   ├─ file_url: "storage://documents/.../ktp.pdf"
        │   └─ submitted_at: "2026-04-15T14:00:00Z"
        │
        ▼ Similar for SIM, STNK, Insurance

T+72:00 Driver registers vehicle
        │
        ├─ POST /api/driver/vehicles
        │   ├─ plate_number: "B 1234 CD"
        │   ├─ vehicle_type: "car"
        │   ├─ model: "Toyota Avanza"
        │   ├─ capacity: 7
        │   └─ year: 2020
        │
        ├─ INSERT vehicles
        │   └─ id: "veh-123"
        │
        ├─ UPDATE drivers
        │   └─ current_vehicle_id: "veh-123"
        │
        ▼ Upload vehicle documents


ADMIN REVIEW PROCESS
════════════════════════════════════════════════════════════

T+96:00 Admin reviews documents
        │
        ├─ GET /api/admin/drivers/abc-123
        │   └─ Fetch all documents, profile, vehicles
        │
        ├─ Verify documents
        │   ├─ Check KTP validity
        │   ├─ Check SIM expiry
        │   └─ Check vehicle registration
        │
        ├─ If approved:
        │   └─ PUT /api/admin/drivers/abc-123/verify
        │      └─ UPDATE drivers SET
        │         ├─ is_verified = true
        │         ├─ registration_status = 'approved'
        │         └─ updated_at = NOW()
        │
        ▼ APPROVED!


DAY 5: FIRST RIDE
═════════════════════════════════════════════════════════════

T+120:00 Driver logs in to dashboard
         │
         ├─ GET /api/driver/profile
         │   └─ Fetch complete profile
         │
         ├─ Display Online/Offline switch
         │   └─ Initially OFFLINE (status='offline')
         │
         ▼ Driver clicks "Go Online"
         
         ├─ Update status
         │   └─ UPDATE drivers SET status='available'
         │
         ├─ Request geolocation permission
         │   └─ "Allow geolocation?"
         │
         ├─ Start GPS tracking (every 10 sec)
         │   ├─ Get location: @107.6189, -6.8957 (Jakarta)
         │   └─ UPDATE drivers SET
         │      ├─ current_lat: -6.8957
         │      ├─ current_lng: 107.6189
         │      └─ status: 'available'
         │
         ▼ REALTIME EVENT
         
         channel = supabase.channel('driver-locations')
         └─ Broadcast NEW available driver
            └─ Riders see "Driver 20m away"
         
         ▼ INCOMING RIDE REQUEST (T+121:00)
         
         Rider creates ride:
         └─ POST /api/rides with {
            pickupLat, pickupLng,
            dropoffLat, dropoffLng,
            rideType: 'car'
          }
         
         System finds drivers:
         ├─ Query: drivers WHERE
         │  ├─ status = 'available'
         │  ├─ is_verified = true
         │  ├─ current_lat/lng NOT NULL
         │  └─ DISTANCE <= 50km
         │
         ├─ Match found: John Driver (
         │  ├─ Distance: 2.3 km away
         │  ├─ Rating: 5.0 ⭐
         │  └─ Vehicle: Toyota Avanza
         │
         ▼ NOTIFICATION
         
         ├─ Firebase Cloud Messaging
         │   └─ Push to driver's mobile
         │
         ├─ Audio alert (Web app)
         │   └─ 880Hz → 1108Hz → 1320Hz
         │
         ├─ Browser notification
         │   ├─ Title: "New Ride!"
         │   ├─ Body: "Pickup at Menara 165 Building"
         │   └─ Icon: pyu_go_icon.png
         │
         ▼ Driver sees notification
         
         ├─ Display:
         │   ├─ "New Ride Request"
         │   ├─ Pickup: "Menara 165 Building"
         │   ├─ Dropoff: "TPU Jeruk Purut"
         │   ├─ Distance: "12.5 km"
         │   ├─ Estimated Fare: "Rp 145.000"
         │   └─ Buttons: [ACCEPT] [DECLINE]
         │
         ▼ Driver clicks ACCEPT (T+122:00)
         
         ├─ POST /api/driver/rides/ride-123/accept
         │
         ├─ Transaction:
         │   ├─ UPDATE rides SET
         │   │  ├─ status = 'accepted'
         │   │  ├─ driver_id = 'driver-123'
         │   │  └─ updated_at = NOW()
         │   │
         │   └─ UPDATE drivers SET
         │      ├─ status = 'busy'
         │      └─ updated_at = NOW()
         │
         ├─ REALTIME EVENT
         │   ├─ Rider notified: "Driver accepted!"
         │   ├─ Driver receives ride details
         │   └─ Navigation starts automatically
         │
         ▼ TRIP IN PROGRESS
         
         ├─ Continuous GPS updates
         │   ├─ Every 10 seconds
         │   └─ Rider sees driver approaching in real-time
         │
         ├─ Driver navigates to pickup
         │   └─ "Arriving in 5 minutes"
         │
         ├─ Arrive at pickup
         │   ├─ Rider enters vehicle
         │   └─ Driver presses "Start Trip"
         │      └─ UPDATE rides SET status = 'in_progress'
         │
         ▼ TRIP COMPLETION (T+145:00)
         
         ├─ Arrive at dropoff
         │   ├─ Passenger exits
         │   └─ Driver clicks "Complete"
         │
         ├─ POST /api/driver/rides/ride-123/complete
         │
         ├─ Edge Function: complete-ride
         │   ├─ Calculate final fare (₱145.500)
         │   ├─ Process payment
         │   ├─ Transfer commission to driver (90%)
         │   └─ Platform fee (10%)
         │
         ├─ UPDATE rides SET
         │   ├─ status = 'completed'
         │   └─ completed_at = NOW()
         │
         ├─ UPDATE drivers SET
         │   ├─ status = 'available'   ◄── Back online!
         │   └─ updated_at = NOW()
         │
         ├─ Rider rates driver:
         │   └─ POST /api/rides/ride-123/rate
         │      ├─ rating: 5
         │      └─ comment: "Driver was very friendly!"
         │
         ├─ Trigger: update_driver_average_rating()
         │   └─ UPDATE drivers SET rating = 5.0 (avg)
         │
         ▼ SUCCESS!
         
         ├─ Driver earns: ₱130.950
         ├─ Driver rating: ⭐⭐⭐⭐⭐ (5.0)
         ├─ Total rides: 1
         └─ Ready for next ride!
```

---

## SUMMARY

Sistem driver pyu-go-connect adalah platform komprehensif yang mengintegrasikan:

### ✅ Key Features:
1. **End-to-End Registration** - Sign-up → Verification → Approval
2. **Real-time Location Tracking** - GPS polling setiap 10 detik
3. **Instant Notifications** - Audio + Visual + Browser alerts
4. **RBAC & Security** - RLS policies, JWT auth, encrypted storage
5. **Document Management** - KTP, SIM, STNK verification workflow
6. **Multi-Platform** - React web + Flutter mobile + Admin dashboard
7. **Rating System** - Automatic average calculation via triggers
8. **Audit Trail** - Comprehensive logging untuk compliance

### 🏗️ Architecture:
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mobile**: Flutter (Riverpod + Geolocator)
- **Deployment**: Vercel (web)

### 📊 Database:
- **15+ tables** (drivers, vehicles, rides, ratings, documents, etc.)
- **Multiple triggers** (profile sync, rating updates, audit logs)
- **RLS policies** untuk data security
- **Real-time subscriptions** untuk live updates

Sistem ini dirancang untuk scalability, security, dan user experience yang superior!

