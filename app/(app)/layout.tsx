import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppSidebar from '@/components/layout/AppSidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
