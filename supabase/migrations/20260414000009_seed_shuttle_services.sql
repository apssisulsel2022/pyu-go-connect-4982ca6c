-- Seed default service types, vehicle types, and pricing rules
-- This migration populates the initial data for the shuttle service system
-- Uses existing shuttle_service_types (Reguler, Semi Executive, Executive)

DO $$
DECLARE
    reguler_id UUID;
    semi_exec_id UUID;
    executive_id UUID;
BEGIN
    -- Get the IDs of existing service types
    SELECT id INTO reguler_id FROM shuttle_service_types WHERE name = 'Reguler' LIMIT 1;
    SELECT id INTO semi_exec_id FROM shuttle_service_types WHERE name = 'Semi Executive' LIMIT 1;
    SELECT id INTO executive_id FROM shuttle_service_types WHERE name = 'Executive' LIMIT 1;

    -- 2. Seed service-vehicle type mappings (only if not already exists)
    INSERT INTO shuttle_service_vehicle_types 
        (service_type_id, vehicle_type, vehicle_name, capacity, facilities, description, active)
    SELECT reguler_id, 'MiniCar', 'Mini Car', 4, ARRAY['AC', 'Radio'], 'Compact economy vehicle', true
    WHERE NOT EXISTS (SELECT 1 FROM shuttle_service_vehicle_types WHERE service_type_id = reguler_id AND vehicle_type = 'MiniCar')
    UNION ALL
    SELECT semi_exec_id, 'SUV', 'SUV Premium', 7, ARRAY['AC', 'Audio System', 'USB Charger', 'Comfortable Seats'], 'Spacious SUV with modern amenities', true
    WHERE NOT EXISTS (SELECT 1 FROM shuttle_service_vehicle_types WHERE service_type_id = semi_exec_id AND vehicle_type = 'SUV')
    UNION ALL
    SELECT executive_id, 'Hiace', 'Hiace Premium', 10, ARRAY['AC', 'Premium Audio', 'USB Charger', 'Reclining Seats', 'WiFi', 'Reading Lights', 'Extra Luggage Space'], 'Luxury coach for maximum comfort', true
    WHERE NOT EXISTS (SELECT 1 FROM shuttle_service_vehicle_types WHERE service_type_id = executive_id AND vehicle_type = 'Hiace');

    -- 3. Seed pricing rules (only if not already exists)
    INSERT INTO shuttle_pricing_rules
        (service_type_id, base_fare_multiplier, distance_cost_per_km, peak_hours_multiplier, peak_hours_start, peak_hours_end, rayon_base_surcharge, description, active)
    SELECT reguler_id, 1.0, 2000, 1.2, '06:00'::time, '09:00'::time, 0, 'Economy service pricing', true
    WHERE NOT EXISTS (SELECT 1 FROM shuttle_pricing_rules WHERE service_type_id = reguler_id AND base_fare_multiplier = 1.0)
    UNION ALL
    SELECT semi_exec_id, 1.2, 3000, 1.2, '06:00'::time, '09:00'::time, 25000, 'Mid-range service pricing with rayon surcharge', true
    WHERE NOT EXISTS (SELECT 1 FROM shuttle_pricing_rules WHERE service_type_id = semi_exec_id AND base_fare_multiplier = 1.2)
    UNION ALL
    SELECT executive_id, 1.5, 5000, 1.2, '06:00'::time, '09:00'::time, 50000, 'Premium service pricing with rayon surcharge', true
    WHERE NOT EXISTS (SELECT 1 FROM shuttle_pricing_rules WHERE service_type_id = executive_id AND base_fare_multiplier = 1.5);

    -- 4. For each existing active schedule, create schedule_services entries
    -- This enables all 3 services for existing schedules (only if not already exists)
    INSERT INTO shuttle_schedule_services 
        (schedule_id, service_type_id, vehicle_type, total_seats, available_seats, is_featured, active)
    SELECT 
        ss.id,
        st.id,
        svt.vehicle_type,
        svt.capacity,
        svt.capacity,
        false,
        true
    FROM shuttle_schedules ss
    CROSS JOIN shuttle_service_types st
    CROSS JOIN shuttle_service_vehicle_types svt
    WHERE svt.service_type_id = st.id
        AND ss.active = true
        AND NOT EXISTS (
            SELECT 1 FROM shuttle_schedule_services sss
            WHERE sss.schedule_id = ss.id 
            AND sss.service_type_id = st.id 
            AND sss.vehicle_type = svt.vehicle_type
        );

END $$;
