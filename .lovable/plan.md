

# Fix: `record_id` UUID Type Mismatch in `log_driver_changes` Trigger

## Root Cause

The `log_driver_changes()` function does:
```sql
INSERT INTO public.audit_logs (table_name, record_id, action, ...)
VALUES ('drivers', OLD.id::text, 'UPDATE', ..., auth.uid()::text);
```

`record_id` is `uuid` but `OLD.id::text` passes a `text`. Same for `changed_by` — it's `uuid` but `auth.uid()::text` casts to text.

## Fix

Single migration to replace the function, removing the `::text` casts:

```sql
CREATE OR REPLACE FUNCTION public.log_driver_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES ('drivers', OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES ('drivers', NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
```

Also fix `process_audit_log()` which has the same pattern — `OLD.id` and `NEW.id` are inserted into `record_id` (uuid) without cast issues there since those tables may have text IDs, but worth checking. Actually `process_audit_log` does `OLD.id` directly without `::text`, so it's fine.

## Files
- **1 migration** to replace `log_driver_changes()` function

