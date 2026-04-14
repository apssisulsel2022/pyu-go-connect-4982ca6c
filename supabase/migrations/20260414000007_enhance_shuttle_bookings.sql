-- Enhance shuttle_bookings table to track pricing details
-- This allows us to:
-- 1. Verify price wasn't tampered with (recalculate on server)
-- 2. Show detailed price breakdown to users
-- 3. Track which service type was booked
-- 4. Audit pricing history

ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS service_type_id UUID REFERENCES shuttle_service_types(id);
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS base_amount DECIMAL(12,2);
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS service_premium DECIMAL(12,2);
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS rayon_surcharge DECIMAL(12,2);
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS distance_amount DECIMAL(12,2);
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2);
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS payment_method TEXT; -- "CASH", "CARD", "TRANSFER"
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS reference_number TEXT UNIQUE;
ALTER TABLE shuttle_bookings ADD COLUMN IF NOT EXISTS booking_notes TEXT;

-- Create index for reference lookup
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_reference ON shuttle_bookings(reference_number);

-- Create index for pricing queries
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_service_type ON shuttle_bookings(service_type_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_total_amount ON shuttle_bookings(total_amount DESC);

-- Create sequence for reference number generation
CREATE SEQUENCE IF NOT EXISTS shuttle_booking_ref_seq START WITH 1000;

-- Function to generate booking reference number
CREATE OR REPLACE FUNCTION generate_shuttle_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'BDG-' 
            || TO_CHAR(NOW(), 'YYYY-MM-DD-') 
            || LPAD(CAST(NEXTVAL('shuttle_booking_ref_seq') AS TEXT), 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference number
DROP TRIGGER IF EXISTS shuttle_booking_generate_reference ON shuttle_bookings;
CREATE TRIGGER shuttle_booking_generate_reference
    BEFORE INSERT ON shuttle_bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_shuttle_booking_reference();

-- Function to verify booking price (prevent fraud)
-- Call this before accepting payment
CREATE OR REPLACE FUNCTION verify_booking_price(
    p_route_id UUID,
    p_service_type_id UUID,
    p_rayon_id UUID,
    p_seat_count INTEGER,
    p_claimed_total DECIMAL
) RETURNS TABLE (
    is_valid BOOLEAN,
    calculated_total DECIMAL,
    provided_total DECIMAL,
    difference DECIMAL
) AS $$
DECLARE
    v_route_fare DECIMAL;
    v_pricing RECORD;
    v_seat_surcharge DECIMAL := 0;
    v_calculated_total DECIMAL;
BEGIN
    -- Get base route fare
    SELECT base_fare INTO v_route_fare
    FROM shuttle_routes
    WHERE id = p_route_id;

    -- Get current pricing rules for service type
    SELECT INTO v_pricing
        base_fare_multiplier,
        distance_cost_per_km,
        peak_hours_multiplier,
        rayon_base_surcharge
    FROM get_current_pricing_for_service(p_service_type_id);

    -- Calculate total (simplified; full implementation would use actual distance, etc.)
    v_calculated_total := v_route_fare * v_pricing.base_fare_multiplier;
    
    -- Add rayon surcharge per seat
    v_calculated_total := v_calculated_total + (v_pricing.rayon_base_surcharge * p_seat_count);

    RETURN QUERY SELECT
        (ABS(p_claimed_total - v_calculated_total) < 1.0) as is_valid,
        v_calculated_total,
        p_claimed_total,
        ABS(p_claimed_total - v_calculated_total);
END;
$$ LANGUAGE plpgsql;
