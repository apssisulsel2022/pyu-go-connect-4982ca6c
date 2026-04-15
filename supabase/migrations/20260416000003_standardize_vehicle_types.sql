-- 1. Standardize Vehicle Types in shuttle_service_vehicle_types
-- We will only support 'MINI_CAR', 'SUV', and 'HIACE'

-- First, map existing legacy types to the new standardized ones to ensure backward compatibility
UPDATE shuttle_service_vehicle_types
SET vehicle_type = 'MINI_CAR', vehicle_name = 'Mini Car'
WHERE vehicle_type ILIKE '%mini%' OR vehicle_type ILIKE '%small%';

UPDATE shuttle_service_vehicle_types
SET vehicle_type = 'SUV', vehicle_name = 'SUV Premium'
WHERE vehicle_type ILIKE '%suv%' OR vehicle_type ILIKE '%avanza%' OR vehicle_type ILIKE '%alphard%';

UPDATE shuttle_service_vehicle_types
SET vehicle_type = 'HIACE', vehicle_name = 'Hiace Executive'
WHERE vehicle_type ILIKE '%hiace%' OR vehicle_type ILIKE '%bus%' OR vehicle_type ILIKE '%van%';

-- Delete any other types that couldn't be mapped (optional, or set to a default)
-- For safety, let's set any remaining to 'SUV'
UPDATE shuttle_service_vehicle_types
SET vehicle_type = 'SUV', vehicle_name = 'SUV Premium'
WHERE vehicle_type NOT IN ('MINI_CAR', 'SUV', 'HIACE');

-- 2. Update shuttle_schedules to use standardized types
UPDATE shuttle_schedules
SET vehicle_type = 'MINI_CAR'
WHERE vehicle_type ILIKE '%mini%' OR vehicle_type ILIKE '%small%';

UPDATE shuttle_schedules
SET vehicle_type = 'SUV'
WHERE vehicle_type ILIKE '%suv%' OR vehicle_type ILIKE '%avanza%' OR vehicle_type ILIKE '%alphard%';

UPDATE shuttle_schedules
SET vehicle_type = 'HIACE'
WHERE vehicle_type ILIKE '%hiace%' OR vehicle_type ILIKE '%bus%' OR vehicle_type ILIKE '%van%';

UPDATE shuttle_schedules
SET vehicle_type = 'SUV'
WHERE vehicle_type NOT IN ('MINI_CAR', 'SUV', 'HIACE');

-- 3. Update shuttle_schedule_services
UPDATE shuttle_schedule_services
SET vehicle_type = 'MINI_CAR'
WHERE vehicle_type ILIKE '%mini%' OR vehicle_type ILIKE '%small%';

UPDATE shuttle_schedule_services
SET vehicle_type = 'SUV'
WHERE vehicle_type ILIKE '%suv%' OR vehicle_type ILIKE '%avanza%' OR vehicle_type ILIKE '%alphard%';

UPDATE shuttle_schedule_services
SET vehicle_type = 'HIACE'
WHERE vehicle_type ILIKE '%hiace%' OR vehicle_type ILIKE '%bus%' OR vehicle_type ILIKE '%van%';

UPDATE shuttle_schedule_services
SET vehicle_type = 'SUV'
WHERE vehicle_type NOT IN ('MINI_CAR', 'SUV', 'HIACE');

-- 4. Update vehicle_layouts if any
UPDATE shuttle_vehicle_layouts
SET vehicle_type = 'MINI_CAR'
WHERE vehicle_type ILIKE '%mini%' OR vehicle_type ILIKE '%small%';

UPDATE shuttle_vehicle_layouts
SET vehicle_type = 'SUV'
WHERE vehicle_type ILIKE '%suv%' OR vehicle_type ILIKE '%avanza%' OR vehicle_type ILIKE '%alphard%';

UPDATE shuttle_vehicle_layouts
SET vehicle_type = 'HIACE'
WHERE vehicle_type ILIKE '%hiace%' OR vehicle_type ILIKE '%bus%' OR vehicle_type ILIKE '%van%';

UPDATE shuttle_vehicle_layouts
SET vehicle_type = 'SUV'
WHERE vehicle_type NOT IN ('MINI_CAR', 'SUV', 'HIACE');
