import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single();
    if (!profile?.is_active || profile.role === 'guest') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { checked_in_by } = body;

    // Get checkout
    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts')
      .select('*')
      .eq('id', params.id)
      .is('checked_in_at', null)
      .single();

    if (checkoutError || !checkout) {
      return NextResponse.json({ error: 'Checkout not found or already returned' }, { status: 404 });
    }

    // Update checkout (DB trigger handles quantity increment)
    const { error: updateError } = await supabase
      .from('checkouts')
      .update({
        checked_in_by,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Audit log
    await supabase.from('audit_logs').insert({
      table_name: 'checkouts',
      record_id: params.id,
      action: 'CHECKIN',
      actor_id: user.id,
      actor_email: user.email,
      new_data: { checked_in_by } as any,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
