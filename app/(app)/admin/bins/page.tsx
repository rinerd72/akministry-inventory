import { createClient } from '@/lib/supabase/server';
import BinsClient from './BinsClient';

export default async function BinsPage() {
  const supabase = createClient();
  const [{ data: bins }, { data: locations }] = await Promise.all([
    supabase.from('storage_bins').select('*, locations(name)').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Storage Bins</h1>
        <p className="text-muted-foreground">Manage storage bins within locations</p>
      </div>
      <BinsClient bins={bins || []} locations={locations || []} />
    </div>
  );
}
