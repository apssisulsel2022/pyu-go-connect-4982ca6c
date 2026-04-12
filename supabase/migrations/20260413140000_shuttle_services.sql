
-- 1. Create enum for Service Categories
CREATE TYPE public.shuttle_service_category AS ENUM ('Reguler', 'Semi Executive', 'Executive');

-- 2. Create Service Types table
CREATE TABLE public.shuttle_service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name public.shuttle_service_category NOT NULL UNIQUE,
  baggage_info TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Insert Service Types data
INSERT INTO public.shuttle_service_types (name, baggage_info, description)
VALUES 
  ('Reguler', 'Bawaan Tas Tangan, Non Bagasi, Non Koper', 'Layanan ekonomi'),
  ('Semi Executive', 'Bagasi Maksimal Koper 20", Tas Tangan', 'Layanan bisnis'),
  ('Executive', 'Bagasi Maksimal Koper 28", 2 Tas Tangan', 'Layanan premium');

-- 4. Add service_type_id and vehicle_type to shuttle_schedules
-- First, ensure shuttle_schedules has these columns
ALTER TABLE public.shuttle_schedules
  ADD COLUMN service_type_id UUID REFERENCES public.shuttle_service_types(id),
  ADD COLUMN vehicle_type TEXT CHECK (vehicle_type IN ('SUV', 'MiniCar', 'Hiace'));

-- 5. Enable RLS
ALTER TABLE public.shuttle_service_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service types viewable by everyone" ON public.shuttle_service_types FOR SELECT USING (true);

-- 6. Indexes
CREATE INDEX idx_shuttle_schedules_service_type ON public.shuttle_schedules(service_type_id);
CREATE INDEX idx_shuttle_schedules_vehicle_type ON public.shuttle_schedules(vehicle_type);
