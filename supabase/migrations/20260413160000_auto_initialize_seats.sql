-- Function to automatically create seats for a new shuttle schedule
CREATE OR REPLACE FUNCTION public.initialize_shuttle_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_num_seats INTEGER;
  v_seat_prefix TEXT := '';
BEGIN
  -- Determine number of seats based on vehicle_type
  -- vehicle_type IN ('SUV', 'MiniCar', 'Hiace')
  CASE NEW.vehicle_type
    WHEN 'SUV' THEN v_num_seats := 7;
    WHEN 'MiniCar' THEN v_num_seats := 4;
    WHEN 'Hiace' THEN v_num_seats := 10;
    ELSE v_num_seats := NEW.total_seats; -- Fallback to total_seats
  END CASE;

  -- Create the seats
  FOR i IN 1..v_num_seats LOOP
    INSERT INTO public.shuttle_seats (schedule_id, seat_number, status)
    VALUES (NEW.id, i::text, 'available')
    ON CONFLICT (schedule_id, seat_number) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger to run after inserting a new schedule
CREATE TRIGGER trigger_initialize_shuttle_seats
AFTER INSERT ON public.shuttle_schedules
FOR EACH ROW
EXECUTE FUNCTION public.initialize_shuttle_seats();

-- Also initialize seats for existing schedules that don't have them yet
DO $$
DECLARE
  r_schedule RECORD;
  v_num_seats INTEGER;
BEGIN
  FOR r_schedule IN (
    SELECT id, vehicle_type, total_seats 
    FROM public.shuttle_schedules 
    WHERE id NOT IN (SELECT DISTINCT schedule_id FROM public.shuttle_seats)
  ) LOOP
    CASE r_schedule.vehicle_type
      WHEN 'SUV' THEN v_num_seats := 7;
      WHEN 'MiniCar' THEN v_num_seats := 4;
      WHEN 'Hiace' THEN v_num_seats := 10;
      ELSE v_num_seats := r_schedule.total_seats;
    END CASE;

    FOR i IN 1..v_num_seats LOOP
      INSERT INTO public.shuttle_seats (schedule_id, seat_number, status)
      VALUES (r_schedule.id, i::text, 'available')
      ON CONFLICT (schedule_id, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
