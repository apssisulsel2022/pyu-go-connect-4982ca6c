-- Create shuttle_vehicle_layouts table
CREATE TABLE IF NOT EXISTS public.shuttle_vehicle_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type TEXT NOT NULL, -- "MINI_CAR", "SUV", "HIACE", "VAN", "MINI_BUS"
    name TEXT NOT NULL,
    description TEXT,
    dimensions JSONB NOT NULL DEFAULT '{"width": 300, "height": 600}',
    layout_data JSONB NOT NULL DEFAULT '{"seats": [], "objects": []}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to vehicle_type if only one active layout per type is allowed
-- Or we can have multiple templates and select one for a schedule.
-- For now, let's allow multiple templates.

-- Enable RLS
ALTER TABLE public.shuttle_vehicle_layouts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active layouts" 
    ON public.shuttle_vehicle_layouts 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can manage layouts" 
    ON public.shuttle_vehicle_layouts 
    FOR ALL 
    USING (
        auth.jwt() ->> 'user_role' = 'admin' 
        OR auth.jwt() ->> 'user_role' = 'super_admin'
    );

-- Trigger for updated_at
CREATE TRIGGER update_shuttle_vehicle_layouts_updated_at
    BEFORE UPDATE ON public.shuttle_vehicle_layouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add layout_id to shuttle_schedules to link a specific layout to a schedule
ALTER TABLE public.shuttle_schedules 
ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES public.shuttle_vehicle_layouts(id) ON DELETE SET NULL;
