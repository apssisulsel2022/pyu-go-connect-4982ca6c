
-- Link shuttle_rayons to shuttle_routes
ALTER TABLE public.shuttle_rayons
  ADD COLUMN route_id UUID REFERENCES public.shuttle_routes(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_shuttle_rayons_route_id ON public.shuttle_rayons(route_id);

-- Update RLS if needed (already viewable by everyone)
