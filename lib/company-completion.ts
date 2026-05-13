export type CompanyCompletionInput = {
  name?: string | null;
  profile_type?: string | null;
  sector?: string | null;
  city?: string | null;
  slug?: string | null;
  logo_url?: string | null;
  whatsapp?: string | null;
  website_url?: string | null;
  description?: string | null;
  company_story?: string | null;
  founder_message?: string | null;
  address?: string | null;
};

const COMPLETION_FIELDS: Array<keyof CompanyCompletionInput> = [
  'name',
  'profile_type',
  'sector',
  'city',
  'slug',
  'logo_url',
  'whatsapp',
  'website_url',
  'description',
  'company_story',
  'founder_message',
  'address',
];

function isFilled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function computeProfileCompletionPercent(company: CompanyCompletionInput): number {
  const completedCount = COMPLETION_FIELDS.reduce((count, fieldName) => {
    return isFilled(company[fieldName]) ? count + 1 : count;
  }, 0);

  const rawPercent = (completedCount / COMPLETION_FIELDS.length) * 100;
  return Math.round(rawPercent);
}
