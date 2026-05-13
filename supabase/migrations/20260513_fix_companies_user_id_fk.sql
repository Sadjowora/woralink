begin;

-- 1) Ensure user_id exists on companies
alter table public.companies
  add column if not exists user_id uuid;

-- 2) Best-effort data sync from legacy owner_id -> user_id when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'owner_id'
  ) THEN
    UPDATE public.companies c
    SET user_id = c.owner_id
    WHERE c.user_id IS NULL
      AND c.owner_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = c.owner_id
      );
  END IF;
END $$;

-- 3) Remove invalid user_id values so FK creation cannot fail
UPDATE public.companies c
SET user_id = NULL
WHERE c.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = c.user_id
  );

-- 4) Drop legacy FK on owner_id (source of current runtime error)
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_owner_id_fkey;

-- 5) Enforce FK on user_id (the column used by the app)
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_user_id_fkey;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;

-- 6) Helpful index for common lookups
CREATE INDEX IF NOT EXISTS idx_companies_user_id
  ON public.companies (user_id);

commit;
