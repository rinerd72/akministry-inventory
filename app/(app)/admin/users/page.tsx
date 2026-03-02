import { createClient } from '@/lib/supabase/server';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase.from('profiles').select('*').order('full_name');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
      <UsersClient users={users || []} />
    </div>
  );
}
