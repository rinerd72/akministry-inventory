'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function deleteItem(itemId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Admin only');

  await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itemId);

  // Audit log
  await supabase.from('audit_logs').insert({
    table_name: 'items',
    record_id: itemId,
    action: 'DELETE',
    actor_id: user.id,
    actor_email: user.email,
  });

  redirect('/items');
}
