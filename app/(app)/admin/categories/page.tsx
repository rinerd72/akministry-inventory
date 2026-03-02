import { createClient } from '@/lib/supabase/server';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-muted-foreground">Manage inventory categories</p>
      </div>
      <CategoriesClient categories={categories || []} />
    </div>
  );
}
