-- Create shuttle_schedule_services table
-- Maps which services (and their seat counts) are available for each schedule
-- Example: A 06:00 Jakarta-Bandung schedule offers all 3 services:
--   - Standard (4 Mini Cars)
--   - Regular (7 SUVs)
--   - Executive (10 Hiaces)

CREATE TABLE shuttle_schedule_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES shuttle_schedules(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES shuttle_service_types(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL, -- "MINI_CAR", "SUV", "HIACE"
    total_seats INTEGER NOT NULL DEFAULT 4,
    available_seats INTEGER NOT NULL DEFAULT 4,
    price_override DECIMAL(12,2), -- If NULL, calculate dynamically; if set, use this fixed price
    is_featured BOOLEAN DEFAULT false, -- Highlight this option to users
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(schedule_id, service_type_id, vehicle_type)
);

-- Indexes for performance
CREATE INDEX idx_schedule_services_schedule_id ON shuttle_schedule_services(schedule_id);
CREATE INDEX idx_schedule_services_service_type_id ON shuttle_schedule_services(service_type_id);
CREATE INDEX idx_schedule_services_vehicle_type ON shuttle_schedule_services(vehicle_type);
CREATE INDEX idx_schedule_services_active ON shuttle_schedule_services(active);

-- Enable RLS
ALTER TABLE shuttle_schedule_services ENABLE ROW LEVEL SECURITY;

-- Public can read active schedule services
CREATE POLICY "public_read_active_schedule_services"
    ON shuttle_schedule_services
    FOR SELECT
    USING (active = true);

-- Users can read their booked schedule services
CREATE POLICY "users_read_their_schedule_services"
    ON shuttle_schedule_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shuttle_bookings sb
            WHERE sb.schedule_id = shuttle_schedule_services.schedule_id
            AND sb.user_id = auth.uid()
        )
    );

-- Admins can manage all
CREATE POLICY "admin_manage_schedule_services"
    ON shuttle_schedule_services
    FOR ALL
    USING (
        auth.jwt() ->> 'user_role' = 'admin'
        OR auth.jwt() ->> 'user_role' = 'super_admin'
    )
    WITH CHECK (
        auth.jwt() ->> 'user_role' = 'admin'
        OR auth.jwt() ->> 'user_role' = 'super_admin'
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_schedule_services_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_services_updated_at
    BEFORE UPDATE ON shuttle_schedule_services
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_services_timestamp();

-- Trigger to decrement available seats when booking is created
CREATE OR REPLACE FUNCTION decrement_schedule_service_seats()
RETURNS TRIGGER AS $$
DECLARE
    v_service_type_id UUID;
BEGIN
    -- Get service type from booking
    SELECT service_type_id INTO v_service_type_id
    FROM shuttle_bookings
    WHERE id = NEW.id;

    -- Decrement available seats
    UPDATE shuttle_schedule_services
    SET available_seats = available_seats - 1
    WHERE schedule_id = NEW.schedule_id
        AND service_type_id = v_service_type_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_services_decrement_on_booking
    AFTER INSERT ON shuttle_bookings
    FOR EACH ROW
    EXECUTE FUNCTION decrement_schedule_service_seats();

-- Trigger to increment available seats when booking is cancelled
CREATE OR REPLACE FUNCTION increment_schedule_service_seats()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment available seats only if cancelling an existing booking
    IF OLD.booking_status != 'CANCELLED' THEN
        UPDATE shuttle_schedule_services
        SET available_seats = available_seats + 1
        WHERE schedule_id = OLD.schedule_id
            AND service_type_id = OLD.service_type_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_services_increment_on_cancel
    AFTER UPDATE ON shuttle_bookings
    FOR EACH ROW
    WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status AND NEW.booking_status = 'CANCELLED')
    EXECUTE FUNCTION increment_schedule_service_seats();

-- Function to get available services for a schedule with calculated prices
CREATE OR REPLACE FUNCTION get_available_services_for_schedule(p_schedule_id UUID)
RETURNS TABLE (
    service_id UUID,
    service_name TEXT,
    vehicle_type TEXT,
    vehicle_name TEXT,
    capacity INTEGER,
    total_seats INTEGER,
    available_seats INTEGER,
    display_price DECIMAL,
    is_featured BOOLEAN,
    facilities TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ss.id,
        st.name,
        ss.vehicle_type,
        svt.vehicle_name,
        svt.capacity,
        ss.total_seats,
        ss.available_seats,
        COALESCE(
            ss.price_override,
            (SELECT base_fare FROM shuttle_routes WHERE id = (
                SELECT route_id FROM shuttle_schedules WHERE id = ss.schedule_id
            )) * prules.base_fare_multiplier
        )::DECIMAL as display_price,
        ss.is_featured,
        svt.facilities
    FROM shuttle_schedule_services ss
    JOIN shuttle_service_types st ON ss.service_type_id = st.id
    JOIN shuttle_service_vehicle_types svt ON ss.service_type_id = svt.service_type_id AND ss.vehicle_type = svt.vehicle_type
    LEFT JOIN LATERAL get_current_pricing_for_service(ss.service_type_id) prules ON true
    WHERE ss.schedule_id = p_schedule_id
        AND ss.active = true
        AND ss.available_seats > 0
    ORDER BY ss.is_featured DESC, st.name ASC;
END;
$$ LANGUAGE plpgsql;
