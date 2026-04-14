-- Integration Migration: Add missing fields for integrated shuttle management
-- This migration ensures all necessary foreign keys and fields exist for the admin UI

-- ============ Add route_id to shuttle_service_vehicle_types ============
ALTER TABLE public.shuttle_service_vehicle_types
ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.shuttle_routes(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_vehicle_types_route_id 
  ON public.shuttle_service_vehicle_types(route_id);

-- ============ Add route_id to shuttle_service_types ============
ALTER TABLE public.shuttle_service_types
ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.shuttle_routes(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_types_route_id 
  ON public.shuttle_service_types(route_id);

-- ============ Ensure service_id is in shuttle_schedules ============
ALTER TABLE public.shuttle_schedules
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.shuttle_service_types(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_service_id 
  ON public.shuttle_schedules(service_id);

-- ============ Add vehicle_id reference to shuttle_schedule_services ============
-- (for better tracking of which vehicle type serves each scheduled service)
ALTER TABLE public.shuttle_schedule_services
ADD COLUMN IF NOT EXISTS vehicle_mapping_id UUID REFERENCES public.shuttle_service_vehicle_types(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_schedule_services_vehicle_mapping_id 
  ON public.shuttle_schedule_services(vehicle_mapping_id);

-- ============ Update RLS Policies for Consistency ============
-- Use has_role() function instead of JWT claims for all shuttle tables

-- Update shuttle_service_vehicle_types RLS
DROP POLICY IF EXISTS "admin_manage_service_vehicle_types" ON public.shuttle_service_vehicle_types;
CREATE POLICY "admin_manage_service_vehicle_types"
    ON public.shuttle_service_vehicle_types
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update shuttle_service_types RLS
DROP POLICY IF EXISTS "Admins can manage service types" ON public.shuttle_service_types;
CREATE POLICY "Admins can manage service types" 
    ON public.shuttle_service_types 
    FOR ALL 
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update shuttle_schedules RLS
DROP POLICY IF EXISTS "Admins can manage schedules" ON public.shuttle_schedules;
CREATE POLICY "Admins can manage schedules" 
    ON public.shuttle_schedules 
    FOR ALL 
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update shuttle_rayons RLS
DROP POLICY IF EXISTS "Admins can manage rayons" ON public.shuttle_rayons;
CREATE POLICY "Admins can manage rayons" 
    ON public.shuttle_rayons 
    FOR ALL 
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update shuttle_pickup_points RLS
DROP POLICY IF EXISTS "Admins can manage pickup points" ON public.shuttle_pickup_points;
CREATE POLICY "Admins can manage pickup points" 
    ON public.shuttle_pickup_points 
    FOR ALL 
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ Add Audit Columns for Admin Tracking ============
ALTER TABLE public.shuttle_routes
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.shuttle_service_types
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.shuttle_rayons
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.shuttle_schedules
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============ Create Composite Indexes for Better Performance ============
-- For admin queries fetching all data for a route
CREATE INDEX IF NOT EXISTS idx_shuttle_rayons_route_active 
  ON public.shuttle_rayons(route_id, active);

CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_route_active 
  ON public.shuttle_schedules(route_id, active);

CREATE INDEX IF NOT EXISTS idx_service_vehicle_types_route_active 
  ON public.shuttle_service_vehicle_types(route_id, active);

-- ============ Add Constraint to Ensure Data Integrity ============
-- Prevent duplicate service types per route
ALTER TABLE public.shuttle_service_types
DROP CONSTRAINT IF EXISTS unique_service_per_route;
ALTER TABLE public.shuttle_service_types
ADD CONSTRAINT unique_service_per_route UNIQUE(route_id, name);

-- Prevent duplicate vehicle types per service
ALTER TABLE public.shuttle_service_vehicle_types
DROP CONSTRAINT IF EXISTS unique_vehicle_per_service_route;
ALTER TABLE public.shuttle_service_vehicle_types
ADD CONSTRAINT unique_vehicle_per_service_route UNIQUE(route_id, service_type_id, vehicle_type);

-- ============ Add Comments for Documentation ============
COMMENT ON TABLE public.shuttle_service_vehicle_types IS 'Maps vehicle types available for each service on each route';
COMMENT ON COLUMN public.shuttle_service_vehicle_types.route_id IS 'Route this vehicle type is available for';
COMMENT ON COLUMN public.shuttle_schedules.service_id IS 'Primary service type for this schedule (can have multiple services via shuttle_schedule_services)';
