import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ItemForm from '@/components/items/ItemForm';

export default async function EditItemPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role === 'guest') redirect('/items');

  const [{ data: item }, { data: categories }, { data: locations }, { data: bins }] = await Promise.all([
    supabase.from('items').select('*').eq('id', params.id).is('deleted_at', null).single(),
    supabase.from('categories').select('id, name, color').order('name'),
    supabase.from('locations').select('id, name').order('name'),
    supabase.from('storage_bins').select('id, name, location_id').order('name'),
  ]);

  if (!item) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
        <p className="text-muted-foreground">Update the details for {item.name}</p>
      </div>
      <ItemForm
        categories={categories || []}
        locations={locations || []}
        bins={bins || []}
        mode="edit"
        item={item}
      />
    </div>
  );
}
