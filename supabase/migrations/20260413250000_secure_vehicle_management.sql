-- Fix RLS for vehicles table to allow drivers to manage their own vehicles
-- We need to check if the driver_id of the vehicle belongs to the authenticated user

-- 1. Policy for drivers to insert their own vehicles
CREATE POLICY "Drivers can insert their own vehicles" ON public.vehicles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers
            WHERE drivers.id = vehicles.driver_id
            AND drivers.user_id = auth.uid()
        )
    );

-- 2. Policy for drivers to update their own vehicles
CREATE POLICY "Drivers can update their own vehicles" ON public.vehicles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.drivers
            WHERE drivers.id = vehicles.driver_id
            AND drivers.user_id = auth.uid()
        )
    );

-- 3. Policy for drivers to delete their own vehicles
CREATE POLICY "Drivers can delete their own vehicles" ON public.vehicles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.drivers
            WHERE drivers.id = vehicles.driver_id
            AND drivers.user_id = auth.uid()
        )
    );

-- 4. Create storage bucket for vehicle images if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicles', 'vehicles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vehicle images
CREATE POLICY "Public Access Vehicles" ON storage.objects FOR SELECT USING (bucket_id = 'vehicles');
CREATE POLICY "Drivers can upload vehicle images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'vehicles' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
