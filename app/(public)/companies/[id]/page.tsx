import { notFound, redirect } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type CompanyByIdPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CompanyByIdPage({ params }: CompanyByIdPageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('companies')
    .select('slug')
    .eq('id', id)
    .maybeSingle<{ slug: string | null }>();

  if (error) {
    notFound();
  }

  const slug = data?.slug?.trim();

  if (!slug) {
    notFound();
  }

  redirect(`/pme/${slug}`);
}
