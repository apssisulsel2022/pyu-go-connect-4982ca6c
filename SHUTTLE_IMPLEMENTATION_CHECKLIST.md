# SHUTTLE SYSTEM - DETAILED IMPLEMENTATION CHECKLIST

## PHASE 1: DATABASE SCHEMA ENHANCEMENT

### 1.1 Create Service-Vehicle Type Mapping
**Status:** 🔴 TODO
**File:** `supabase/migrations/20260414000004_create_service_vehicle_types.sql`

```sql
-- Create shuttle_service_vehicle_types table
CREATE TABLE shuttle_service_vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type_id UUID NOT NULL REFERENCES shuttle_service_types(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL, -- "MINI_CAR", "SUV", "HIACE"
    vehicle_name TEXT NOT NULL, -- "Mini Car", "SUV Premium", "Hiace"
    capacity INTEGER NOT NULL DEFAULT 4,
    facilities TEXT[] DEFAULT '{}', -- ["AC", "Audio", "Charger"]
    price_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0, -- 1.0, 1.2, 1.5
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_vehicle_types_service_id ON shuttle_service_vehicle_types(service_type_id);
CREATE INDEX idx_service_vehicle_types_vehicle_type ON shuttle_service_vehicle_types(vehicle_type);
CREATE INDEX idx_service_vehicle_types_active ON shuttle_service_vehicle_types(active) WHERE active = true;

-- RLS
ALTER TABLE shuttle_service_vehicle_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_service_vehicle_types"
    ON shuttle_service_vehicle_types
    FOR SELECT
    USING (active = true);

CREATE POLICY "admin_manage_service_vehicle_types"
    ON shuttle_service_vehicle_types
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Seed default data:
-- Standard Service: Mini Car (4 seat, 1.0x multiplier)
-- Regular Service: SUV (7 seat, 1.2x multiplier)  
-- Executive Service: Hiace (10 seat, 1.5x multiplier)
```

### 1.2 Create Pricing Rules Table
**Status:** 🔴 TODO
**File:** `supabase/migrations/20260414000005_create_pricing_rules.sql`

```sql
CREATE TABLE shuttle_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type_id UUID NOT NULL REFERENCES shuttle_service_types(id) ON DELETE CASCADE,
    base_fare_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    distance_cost_per_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    peak_hours_multiplier DECIMAL(5,2) DEFAULT 1.0,
    rayon_base_surcharge DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pricing_rules_service_id ON shuttle_pricing_rules(service_type_id);
CREATE INDEX idx_pricing_rules_active ON shuttle_pricing_rules(active) WHERE active = true;

-- RLS
ALTER TABLE shuttle_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_pricing_rules"
    ON shuttle_pricing_rules
    FOR SELECT
    USING (active = true AND effective_date <= CURRENT_DATE);

CREATE POLICY "admin_manage_pricing_rules"
    ON shuttle_pricing_rules
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### 1.3 Modify shuttle_bookings for Pricing Tracking
**Status:** 🔴 TODO
**File:** `supabase/migrations/20260414000006_enhance_shuttle_bookings.sql`

```sql
ALTER TABLE shuttle_bookings ADD COLUMNS (
    service_type_id UUID REFERENCES shuttle_service_types(id),
    vehicle_type TEXT,
    base_amount DECIMAL(12,2),
    service_premium DECIMAL(12,2),
    rayon_surcharge DECIMAL(12,2),
    distance_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    payment_method TEXT, -- "CASH", "CARD", "TRANSFER"
    reference_number TEXT UNIQUE,
    booking_notes TEXT
);

-- Create trigger to generate reference number
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'BDG-' || TO_CHAR(NOW(), 'YYYY-MM-DD-') || LPAD(CAST(NEXTVAL('booking_ref_seq') AS TEXT), 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1;

CREATE TRIGGER set_booking_reference
    BEFORE INSERT ON shuttle_bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_reference();
```

### 1.4 Create Schedule-Service Availability Matrix
**Status:** 🔴 TODO
**File:** `supabase/migrations/20260414000007_create_schedule_services.sql`

```sql
CREATE TABLE shuttle_schedule_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES shuttle_schedules(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES shuttle_service_types(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price_override DECIMAL(12,2), -- NULL = use calculated, else use this
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(schedule_id, service_type_id, vehicle_type)
);

-- Indexes
CREATE INDEX idx_schedule_services_schedule_id ON shuttle_schedule_services(schedule_id);
CREATE INDEX idx_schedule_services_service_id ON shuttle_schedule_services(service_type_id);

-- RLS
ALTER TABLE shuttle_schedule_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_schedule_services"
    ON shuttle_schedule_services
    FOR SELECT
    USING (active = true);

CREATE POLICY "admin_manage_schedule_services"
    ON shuttle_schedule_services
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Trigger to update available seats when booking created
CREATE OR REPLACE FUNCTION update_schedule_service_seats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE shuttle_schedule_services
        SET available_seats = available_seats - 1
        WHERE schedule_id = NEW.schedule_id
        AND service_type_id = NEW.service_type_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE shuttle_schedule_services
        SET available_seats = available_seats + 1
        WHERE schedule_id = OLD.schedule_id
        AND service_type_id = OLD.service_type_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_seats_on_booking
    AFTER INSERT OR DELETE ON shuttle_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_service_seats();
```

---

## PHASE 2: BACKEND SERVICE LAYER

### 2.1 Create ShuttleService
**Status:** 🔴 TODO
**File:** `src/services/ShuttleService.ts`

```typescript
// Service for shuttle booking calculations and management

export interface ServiceVehicleOption {
    serviceTypeId: string;
    serviceName: string;
    vehicleType: string;
    vehicleName: string;
    capacity: number;
    facilities: string[];
    basePricing: {
        baseAmount: number;
        distanceMultiplier: number;
        peakMultiplier: number;
    };
    displayPrice: number;
    availableSeats: number;
}

export interface PriceBreakdown {
    baseAmount: number;
    servicePremium: number;
    rayonSurcharge: number;
    distanceAmount: number;
    peakHoursMultiplier: number;
    totalAmount: number;
    breakdown: {
        label: string;
        amount: number;
    }[];
}

class ShuttleService {
    // Get all available services for a schedule
    async getAvailableServices(scheduleId: string): Promise<ServiceVehicleOption[]> {
        // Query shuttle_schedule_services + shuttle_service_vehicle_types
        // Calculate display prices
        // Return array of 3 options
    }

    // Calculate price for specific combination
    async calculatePrice(
        routeId: string,
        scheduleId: string,
        serviceTypeId: string,
        rayonId: string
    ): Promise<PriceBreakdown> {
        // 1. Get base route fare
        // 2. Get service pricing multiplier
        // 3. Get distance surcharge
        // 4. Get rayon surcharge
        // 5. Check if peak hours (optional)
        // Return detailed breakdown
    }

    // Get schedules with pre-calculated prices
    async getSchedulesWithPricing(
        routeId: string,
        travelDate: Date
    ): Promise<(Shuttle_Schedule & { services: ServiceVehicleOption[] })[]> {
        // Query schedules for route
        // For each, get available services
        // Return with pricing populated
    }

    // Create booking atomically with price verification
    async createBooking(
        userId: string,
        bookingData: {
            scheduleId: string;
            serviceTypeId: string;
            rayonId: string;
            seatNumbers: number[];
            passengerInfo: { name: string; phone: string }[];
            paymentMethod: string;
            expectedPrice: number; // For verification
        }
    ): Promise<string> {
        // 1. Verify user session
        // 2. Verify seats available
        // 3. Recalculate price (verify expectedPrice matches)
        // 4. Lock seats (transaction)
        // 5. Create booking record
        // 6. Create booking detail records
        // 7. Log audit trail
        // 8. Return booking reference
    }

    // Get booking details
    async getBooking(bookingId: string): Promise<BookingDetail> {
        // Return full booking with price breakdown
    }

    // Admin: Get all bookings with filters
    async getAdminBookings(filters: {
        scheduleId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        status?: string;
    }): Promise<BookingDetail[]> {
        // Query with filters, return admin view
    }
}

export default new ShuttleService();
```

### 2.2 Create Price Calculation Utility
**Status:** 🔴 TODO
**File:** `src/services/PriceCalculator.ts`

```typescript
export class PriceCalculator {
    static async calculateBookingPrice(
        baseRouteFare: number,
        serviceTypeId: string,
        distanceKm: number,
        rayonId: string,
        isPeakHours?: boolean
    ): Promise<PriceBreakdown> {
        // 1. Get pricing rules for service type
        const rules = await this.getPricingRules(serviceTypeId);
        
        // 2. Calculate components
        const baseAmount = baseRouteFare * rules.base_fare_multiplier;
        const distanceAmount = distanceKm * rules.distance_cost_per_km;
        const peakMultiplier = isPeakHours ? rules.peak_hours_multiplier : 1.0;
        
        // 3. Get rayon surcharge
        const rayonSurcharge = await this.getRayonSurcharge(rayonId);
        
        // 4. Combine
        const subtotal = baseAmount + distanceAmount + rayonSurcharge;
        const totalAmount = subtotal * peakMultiplier;
        
        return {
            baseAmount,
            servicePremium: (rules.base_fare_multiplier - 1.0) * baseRouteFare,
            rayonSurcharge,
            distanceAmount,
            peakHoursMultiplier: peakMultiplier,
            totalAmount,
            breakdown: [
                { label: 'Base Fare', amount: baseAmount },
                { label: 'Service Premium', amount: (rules.base_fare_multiplier - 1.0) * baseRouteFare },
                { label: 'Distance Charge', amount: distanceAmount },
                { label: 'Rayon Surcharge', amount: rayonSurcharge },
                ...(peakMultiplier > 1.0 ? [{ label: 'Peak Hours Premium', amount: (peakMultiplier - 1.0) * subtotal }] : [])
            ]
        };
    }

    private static async getPricingRules(serviceTypeId: string) {
        // Query from database
    }

    private static async getRayonSurcharge(rayonId: string): Promise<number> {
        // Query rayon-specific surcharge
    }
}
```

---

## PHASE 3: FRONTEND - USER BOOKING UI

### 3.1 Refactor Shuttle.tsx
**Status:** 🔴 TODO
**Changes:** Restructure from multiple state variables to cleaner state management

```typescript
// src/pages/Shuttle.tsx - NEW STRUCTURE

interface BookingState {
    // Selection state
    selectedRoute?: ShuttleRoute;
    selectedSchedule?: ShuttleSchedule;
    selectedService?: ServiceVehicleOption;
    selectedRayon?: ShuttleRayon;
    selectedSeats: number[];
    selectedPickupPoint?: ShuttlePickupPoint;
    
    // Passenger state
    passengers: { seatNumber: number; name: string; phone: string }[];
    
    // Pricing state
    priceBreakdown?: PriceBreakdown;
    totalPrice?: number;
    
    // UI state
    currentStep: 'route' | 'schedule' | 'service' | 'rayon' | 'seats' | 'passengers' | 'payment' | 'confirmation';
    isLoading: boolean;
    error?: string;
}

export default function Shuttle() {
    const [state, setState] = useState<BookingState>(...);
    
    // Step 1: Route selection
    // Step 2: Schedule selection
    // Step 3: Service & Vehicle selection (NEW - unified)
    // Step 4: Rayon (pickup location) with calculated fare
    // Step 5: Seat selection
    // Step 6: Passenger info
    // Step 7: Payment review & confirmation
    
    return (
        <div className="shuttle-booking">
            {state.currentStep === 'route' && <RouteSelector ... />}
            {state.currentStep === 'schedule' && <ScheduleSelector ... />}
            {state.currentStep === 'service' && <ServiceVehicleSelector ... />}
            {state.currentStep === 'rayon' && <RayonPickupSelector ... />}
            {state.currentStep === 'seats' && <SeatSelector ... />}
            {state.currentStep === 'passengers' && <PassengerInfoForm ... />}
            {state.currentStep === 'payment' && <PaymentReview ... />}
            {state.currentStep === 'confirmation' && <ConfirmationPage ... />}
        </div>
    );
}
```

### 3.2 Create ServiceVehicleSelector Component
**Status:** 🔴 TODO
**File:** `src/components/shuttle/ServiceVehicleSelector.tsx`

```typescript
interface Props {
    scheduleId: string;
    routeFare: number;
    onSelect: (service: ServiceVehicleOption) => void;
}

export function ServiceVehicleSelector({ scheduleId, routeFare, onSelect }: Props) {
    const [services, setServices] = useState<ServiceVehicleOption[]>([]);
    const [selected, setSelected] = useState<string>();
    
    useEffect(() => {
        ShuttleService.getAvailableServices(scheduleId).then(setServices);
    }, [scheduleId]);
    
    return (
        <div className="service-vehicle-selector">
            <h3>Select Service & Vehicle</h3>
            <div className="options-grid">
                {services.map(service => (
                    <button
                        key={`${service.serviceTypeId}-${service.vehicleType}`}
                        className={`option ${selected === service.serviceTypeId ? 'selected' : ''}`}
                        onClick={() => {
                            setSelected(service.serviceTypeId);
                            onSelect(service);
                        }}
                    >
                        <div className="name">{service.serviceName}</div>
                        <div className="vehicle">({service.vehicleName})</div>
                        <div className="capacity">
                            👥 {service.capacity} seat{service.capacity > 1 ? 's' : ''}
                        </div>
                        <div className="facilities">
                            {service.facilities.map(f => <Badge key={f}>{f}</Badge>)}
                        </div>
                        <div className="price">
                            <span className="label">Rp</span>
                            <span className="amount">{service.displayPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="availability">
                            {service.availableSeats} seats available
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
```

### 3.3 Create PriceBreakdown Component
**Status:** 🔴 TODO
**File:** `src/components/shuttle/PriceBreakdown.tsx`

```typescript
interface Props {
    breakdown: PriceBreakdown;
}

export function PriceBreakdown({ breakdown }: Props) {
    return (
        <div className="price-breakdown">
            <div className="items">
                {breakdown.breakdown.map((item, i) => (
                    <div key={i} className="item">
                        <span className="label">{item.label}</span>
                        <span className="amount">
                            Rp {item.amount.toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}
            </div>
            <div className="divider" />
            <div className="total">
                <span className="label">TOTAL</span>
                <span className="amount">
                    Rp {breakdown.totalAmount.toLocaleString('id-ID')}
                </span>
            </div>
        </div>
    );
}
```

---

## PHASE 4: FRONTEND - ADMIN MANAGEMENT UI

### 4.1 Create Service Types Management Tab
**Status:** 🔴 TODO
**File:** `src/components/admin/shuttle/ServiceTypesTab.tsx`

```typescript
export function ServiceTypesTab() {
    const [services, setServices] = useState<ShuttleServiceType[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string>();
    
    return (
        <div className="service-types-tab">
            <div className="header">
                <h3>Service Types</h3>
                <Button onClick={() => setIsOpen(true)}>+ Add Service Type</Button>
            </div>
            
            <Table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Baggage</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map(service => (
                        <tr key={service.id}>
                            <td>{service.name}</td>
                            <td>{service.description}</td>
                            <td>{service.baggage_info}</td>
                            <td>
                                <Badge>{service.active ? 'Active' : 'Inactive'}</Badge>
                            </td>
                            <td>
                                <Button size="sm" onClick={() => {
                                    setEditingId(service.id);
                                    setIsOpen(true);
                                }}>Edit</Button>
                                <Button size="sm" variant="destructive">Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            
            {isOpen && (
                <ServiceTypeDialog
                    isOpen={isOpen}
                    editingId={editingId}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingId(undefined);
                    }}
                    onSave={() => {
                        // Reload services
                    }}
                />
            )}
        </div>
    );
}
```

### 4.2 Create Pricing Rules Management Tab
**Status:** 🔴 TODO
**File:** `src/components/admin/shuttle/PricingRulesTab.tsx`

Shows pricing multipliers and surcharges for each service type.

### 4.3 Enhance Schedule Management
**Status:** 🔴 TODO
**File:** `src/components/admin/shuttle/ScheduleForm.tsx` (modify existing)

Add section to select which services available for this schedule:
```
┌─ SERVICE AVAILABILITY ─────────────┐
│ ☑ Standard (Mini Car, 4 seat)     │
│   Total: 4 | Price: Rp 150.000    │
│            [Override Price] ________│
│                                  │
│ ☑ Regular (SUV, 7 seat)          │
│   Total: 7 | Price: Rp 200.000    │
│            [Override Price] ________│
│                                  │
│ ☑ Executive (Hiace, 10 seat)     │
│   Total: 10 | Price: Rp 300.000   │
│             [Override Price] ________│
└──────────────────────────────────┘
```

---

## PHASE 5: INTEGRATION & TESTING

### 5.1 Database Migration Checklist
- [ ] Run migration 20260414000004_create_service_vehicle_types.sql
- [ ] Run migration 20260414000005_create_pricing_rules.sql
- [ ] Run migration 20260414000006_enhance_shuttle_bookings.sql
- [ ] Run migration 20260414000007_create_schedule_services.sql
- [ ] Seed default data (3 service types, 3 vehicle types, pricing rules)

### 5.2 Backend Service Testing
- [ ] Test ShuttleService.getAvailableServices()
- [ ] Test PriceCalculator calculations
- [ ] Test ShuttleService.createBooking() atomic transaction
- [ ] Test price verification prevents fraud
- [ ] Test seat locking mechanism

### 5.3 User Booking Flow Testing
- [ ] Route selection loads correctly
- [ ] Schedule selection shows proper times
- [ ] Service/vehicle selector shows all 3 options
- [ ] Price breakdown calculates correctly
- [ ] Rayon surcharge applied
- [ ] Distance charge applied
- [ ] Seat selection prevents double-booking
- [ ] Booking confirmation generates reference number
- [ ] Email/PDF ticket sent

### 5.4 Admin Management Testing
- [ ] Service types CRUD works
- [ ] Pricing rules CRUD works
- [ ] Schedule creation/editing works
- [ ] Price overrides apply
- [ ] Booking view shows all details

### 5.5 Performance Testing
- [ ] Price calculation < 100ms
- [ ] Service list load < 200ms
- [ ] Booking creation (with transaction) < 500ms
- [ ] Admin booking list with 1000+ bookongs < 1s

### 5.6 Security Testing
- [ ] Price tampering prevented (recalculated server-side)
- [ ] Seat locking prevents race conditions
- [ ] RLS policies enforce role-based access
- [ ] Audit logging tracks price changes
- [ ] Concurrent bookings handled correctly

---

## PRIORITY MATRIX

| Task | Phase | Effort | Priority | Blocker |
|------|-------|--------|----------|---------|
| Service-Vehicle Type Mapping | 1 | 2h | 🔴 Critical | YES |
| Pricing Rules Table | 1 | 2h | 🔴 Critical | YES |
| ShuttleService Backend | 2 | 3h | 🔴 Critical | YES |
| PriceCalculator | 2 | 2h | 🔴 Critical | YES |
| ServiceVehicleSelector UI | 3 | 2h | 🔴 Critical | NO |
| Refactor Shuttle.tsx | 3 | 3h | 🔴 Critical | NO |
| Admin Service Types Tab | 4 | 3h | 🟡 Important | NO |
| Admin Pricing Rules Tab | 4 | 3h | 🟡 Important | NO |
| Admin Schedule Enhancement | 4 | 2h | 🟡 Important | NO |
| Full Integration Testing | 5 | 4h | 🟢 Essential | NO |

**Total Critical Path:** ~11 hours
**Total All Tasks:** ~31 hours

---

## MIGRATION GUIDE FOR EXISTING DATA

### Step 1: Create Service Types
```sql
INSERT INTO shuttle_service_types (name, description, baggage_info) VALUES
('Standard', 'Economy service', 'Basic luggage'),
('Regular', 'Mid-range service', 'With baggage'),
('Executive', 'Premium service', 'Full baggage + extras');
```

### Step 2: Create Service-Vehicle Mappings
```sql
INSERT INTO shuttle_service_vehicle_types (service_type_id, vehicle_type, vehicle_name, capacity, facilities, price_multiplier) VALUES
-- Standard Service
(standard_id, 'MINI_CAR', 'Mini Car', 4, '{"AC", "Compact"}', 1.0),
-- Regular Service
(regular_id, 'SUV', 'SUV Premium', 7, '{"AC", "Audio", "Charger"}', 1.2),
-- Executive Service
(executive_id, 'HIACE', 'Hiace', 10, '{"TV", "Reclining", "WiFi", "Charger"}', 1.5);
```

### Step 3: Populate Pricing Rules
```sql
INSERT INTO shuttle_pricing_rules (service_type_id, base_fare_multiplier, distance_cost_per_km, peak_hours_multiplier) VALUES
(standard_id, 1.0, 2000, 1.2),
(regular_id, 1.2, 3000, 1.2),
(executive_id, 1.5, 5000, 1.2);
```

### Step 4: Migrate Existing Schedules
```sql
-- For each existing schedule, create schedule_services entries
INSERT INTO shuttle_schedule_services (schedule_id, service_type_id, vehicle_type, total_seats, available_seats)
SELECT 
    ss.id,
    st.id,
    svt.vehicle_type,
    svt.capacity,
    svt.capacity
FROM shuttle_schedules ss
CROSS JOIN shuttle_service_types st
CROSS JOIN shuttle_service_vehicle_types svt
WHERE svt.service_type_id = st.id;
```

---

**Document Version:** 1.0  
**Created:** April 14, 2026  
**Status:** Checklist Complete - Ready for Development Kickoff
