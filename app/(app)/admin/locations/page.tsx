import { createClient } from '@/lib/supabase/server';
import LocationsClient from './LocationsClient';

export default async function LocationsPage() {
  const supabase = createClient();
  const { data: locations } = await supabase.from('locations').select('*').order('name');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <p className="text-muted-foreground">Manage storage locations</p>
      </div>
      <LocationsClient locations={locations || []} />
    </div>
  );
}
