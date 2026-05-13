begin;

-- Final cleanup: drop legacy owner_id only when no companies RLS policy still references it.
DO $$
DECLARE
  owner_column_exists boolean;
  policy_dep_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'owner_id'
  ) INTO owner_column_exists;

  IF NOT owner_column_exists THEN
    RAISE NOTICE 'Column public.companies.owner_id does not exist, skipping cleanup.';
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO policy_dep_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'companies'
    AND (
      (qual IS NOT NULL AND qual ILIKE '%owner_id%')
      OR (with_check IS NOT NULL AND with_check ILIKE '%owner_id%')
    );

  IF policy_dep_count > 0 THEN
    RAISE EXCEPTION 'Cannot drop public.companies.owner_id: % RLS policy/policies still reference owner_id. Update policies first, then re-run this migration.',
      policy_dep_count;
  END IF;

  ALTER TABLE public.companies
    DROP COLUMN owner_id;

  RAISE NOTICE 'Dropped legacy column public.companies.owner_id successfully.';
END $$;

commit;
