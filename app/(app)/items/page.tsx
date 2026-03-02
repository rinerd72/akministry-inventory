import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ItemsClient from './ItemsClient';

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; location?: string; stock?: string; view?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  let query = supabase
    .from('items')
    .select(`
      *,
      categories(id, name, color),
      locations(id, name),
      storage_bins(id, name)
    `)
    .is('deleted_at', null)
    .order('name');

  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`);
  }
  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category_id', searchParams.category);
  }
  if (searchParams.location && searchParams.location !== 'all') {
    query = query.eq('location_id', searchParams.location);
  }

  const { data: items } = await query;

  const { data: categories } = await supabase.from('categories').select('id, name, color').order('name');
  const { data: locations } = await supabase.from('locations').select('id, name').order('name');

  let filteredItems = items || [];
  if (searchParams.stock === 'low') {
    filteredItems = filteredItems.filter((i: any) => i.quantity <= i.min_quantity && i.quantity > 0);
  } else if (searchParams.stock === 'out') {
    filteredItems = filteredItems.filter((i: any) => i.quantity === 0);
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'user';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-muted-foreground">{filteredItems.length} items</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/items/new"><Plus className="h-4 w-4 mr-2" />Add Item</Link>
          </Button>
        )}
      </div>

      <ItemsClient
        items={filteredItems}
        categories={categories || []}
        locations={locations || []}
        canEdit={canEdit}
        initialSearch={searchParams.search || ''}
        initialCategory={searchParams.category || 'all'}
        initialLocation={searchParams.location || 'all'}
        initialStock={searchParams.stock || 'all'}
        initialView={searchParams.view || 'grid'}
      />
    </div>
  );
}
