import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single();
    if (!profile?.is_active || profile.role === 'guest') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { item_id, checked_out_by, quantity, purpose, expected_return } = body;

    // Validate
    if (!item_id || !checked_out_by || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check current quantity with lock-style check
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, name, quantity, unit')
      .eq('id', item_id)
      .is('deleted_at', null)
      .single();

    if (itemError || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (item.quantity < quantity) {
      return NextResponse.json({ error: `Only ${item.quantity} ${item.unit} available` }, { status: 400 });
    }

    // Create checkout (DB trigger handles quantity decrement)
    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts')
      .insert({
        item_id,
        checked_out_by,
        quantity,
        purpose: purpose || null,
        expected_return: expected_return || null,
      })
      .select()
      .single();

    if (checkoutError) return NextResponse.json({ error: checkoutError.message }, { status: 500 });

    // Audit log
    await supabase.from('audit_logs').insert({
      table_name: 'checkouts',
      record_id: checkout.id,
      action: 'CHECKOUT',
      actor_id: user.id,
      actor_email: user.email,
      new_data: { item_id, quantity, purpose } as any,
    });

    return NextResponse.json({ checkout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
