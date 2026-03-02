import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get all items that are at or below min_quantity
    const { data: items } = await supabase
      .from('items')
      .select('id, name, quantity, min_quantity, unit, locations(name)')
      .is('deleted_at', null);

    const lowStockItems = (items || []).filter((i: any) => i.quantity <= i.min_quantity);

    if (lowStockItems.length === 0) {
      return NextResponse.json({ message: 'No low stock items' });
    }

    // Get admin emails
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (!admins?.length) {
      return NextResponse.json({ message: 'No admins to notify' });
    }

    // Send email via Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const itemsList = lowStockItems
      .map((i: any) => `• ${i.name}: ${i.quantity}/${i.min_quantity} ${i.unit}${i.locations ? ` (${i.locations.name})` : ''}`)
      .join('\n');

    for (const admin of admins) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@ministry.org',
        to: admin.email,
        subject: `[Ministry Inventory] ${lowStockItems.length} items are low on stock`,
        text: `The following items are at or below their minimum quantity:\n\n${itemsList}\n\nLog in to manage inventory: ${process.env.NEXT_PUBLIC_APP_URL}/items?stock=low`,
        html: `
          <h2>Low Stock Alert</h2>
          <p>The following items are at or below their minimum quantity:</p>
          <ul>
            ${lowStockItems.map((i: any) => `<li><strong>${i.name}</strong>: ${i.quantity} of ${i.min_quantity} ${i.unit}${i.locations ? ` at ${i.locations.name}` : ''}</li>`).join('')}
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/items?stock=low">View low stock items</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, notified: admins.length, items: lowStockItems.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
