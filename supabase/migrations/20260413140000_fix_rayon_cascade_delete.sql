-- Fix cascade delete for shuttle_bookings.rayon_id
-- This allows deleting rayons that have related bookings

ALTER TABLE public.shuttle_bookings
  DROP CONSTRAINT shuttle_bookings_rayon_id_fkey;

ALTER TABLE public.shuttle_bookings
  ADD CONSTRAINT shuttle_bookings_rayon_id_fkey 
  FOREIGN KEY (rayon_id) REFERENCES public.shuttle_rayons(id) ON DELETE CASCADE;
