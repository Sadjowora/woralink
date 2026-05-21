-- Add 'Startup' to profile_type check constraint
-- This allows users to register startups in the onboarding flow

-- Drop the old constraint if it exists
ALTER TABLE public.companies
DROP CONSTRAINT IF EXISTS companies_profile_type_check;

-- Add new constraint with all valid profile types
ALTER TABLE public.companies
ADD CONSTRAINT companies_profile_type_check
CHECK (profile_type IN ('PME', 'Startup', 'Artisan', 'Freelance'));
