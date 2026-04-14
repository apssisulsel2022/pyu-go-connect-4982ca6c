-- Create shuttle_service_vehicle_types table
-- Maps which vehicle types are available for each service type
-- Example: Standard service uses Mini Car, Regular uses SUV, Executive uses Hiace

CREATE TABLE shuttle_service_vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type_id UUID NOT NULL REFERENCES shuttle_service_types(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL, -- "MINI_CAR", "SUV", "HIACE"
    vehicle_name TEXT NOT NULL, -- Display name "Mini Car", "SUV Premium", "Hiace"
    capacity INTEGER NOT NULL DEFAULT 4,
    facilities TEXT[] DEFAULT '{}', -- ["AC", "Audio", "Charger"]
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_service_vehicle_types_service_id ON shuttle_service_vehicle_types(service_type_id);
CREATE INDEX idx_service_vehicle_types_vehicle_type ON shuttle_service_vehicle_types(vehicle_type);
CREATE INDEX idx_service_vehicle_types_active ON shuttle_service_vehicle_types(active);

-- Enable RLS
ALTER TABLE shuttle_service_vehicle_types ENABLE ROW LEVEL SECURITY;

-- Public can read active service-vehicle types
CREATE POLICY "public_read_active_service_vehicle_types"
    ON shuttle_service_vehicle_types
    FOR SELECT
    USING (active = true);

-- Admins can manage all
CREATE POLICY "admin_manage_service_vehicle_types"
    ON shuttle_service_vehicle_types
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
CREATE OR REPLACE FUNCTION update_service_vehicle_types_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_vehicle_types_updated_at
    BEFORE UPDATE ON shuttle_service_vehicle_types
    FOR EACH ROW
    EXECUTE FUNCTION update_service_vehicle_types_timestamp();
