-- Create shuttle_pricing_rules table
-- Defines dynamic pricing for each service type
-- Allows base multiplier, distance multiplier, peak hour multiplier

CREATE TABLE shuttle_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type_id UUID NOT NULL REFERENCES shuttle_service_types(id) ON DELETE CASCADE,
    base_fare_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0, -- Standard=1.0, Regular=1.2, Executive=1.5
    distance_cost_per_km DECIMAL(10,2) NOT NULL DEFAULT 0, -- Cost per KM for this service
    peak_hours_multiplier DECIMAL(5,2) DEFAULT 1.0, -- Apply during rush hours (optional)
    peak_hours_start TIME, -- When peak pricing starts
    peak_hours_end TIME, -- When peak pricing ends
    rayon_base_surcharge DECIMAL(10,2) DEFAULT 0, -- Additional surcharge per rayon
    description TEXT,
    active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pricing_rules_service_id ON shuttle_pricing_rules(service_type_id);
CREATE INDEX idx_pricing_rules_active ON shuttle_pricing_rules(active);
CREATE INDEX idx_pricing_rules_effective_date ON shuttle_pricing_rules(effective_date DESC);

-- Enable RLS
ALTER TABLE shuttle_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Public can read active pricing rules (for UI display)
CREATE POLICY "public_read_active_pricing_rules"
    ON shuttle_pricing_rules
    FOR SELECT
    USING (
        active = true 
        AND effective_date <= CURRENT_DATE
    );

-- Admins can manage pricing
CREATE POLICY "admin_manage_pricing_rules"
    ON shuttle_pricing_rules
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
CREATE OR REPLACE FUNCTION update_pricing_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_rules_updated_at
    BEFORE UPDATE ON shuttle_pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_pricing_rules_timestamp();

-- Function to get current pricing (considers peak hours)
CREATE OR REPLACE FUNCTION get_current_pricing_for_service(p_service_id UUID)
RETURNS TABLE (
    service_type_id UUID,
    base_fare_multiplier DECIMAL,
    distance_cost_per_km DECIMAL,
    peak_hours_multiplier DECIMAL,
    rayon_base_surcharge DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.service_type_id,
        pr.base_fare_multiplier,
        pr.distance_cost_per_km,
        CASE
            WHEN pr.peak_hours_start IS NOT NULL
                AND pr.peak_hours_end IS NOT NULL
                AND CURRENT_TIME >= pr.peak_hours_start
                AND CURRENT_TIME < pr.peak_hours_end
            THEN pr.peak_hours_multiplier
            ELSE 1.0
        END as peak_multiplier,
        pr.rayon_base_surcharge
    FROM shuttle_pricing_rules pr
    WHERE pr.service_type_id = p_service_id
        AND pr.active = true
        AND pr.effective_date <= CURRENT_DATE
    ORDER BY pr.effective_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
