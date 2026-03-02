import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn, formatDateTime } from '@/lib/utils';
import { ArrowLeftRight, AlertTriangle } from 'lucide-react';

export default async function CheckoutsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  let query = supabase
    .from('checkouts')
    .select(`
      *,
      items(id, name, unit, image_url),
      profiles!checkouts_checked_out_by_fkey(full_name, email)
    `)
    .is('checked_in_at', null)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('checked_out_by', user.id);
  }

  const { data: activeCheckouts } = await query;

  // Also get recently returned (last 30 days)
  let historyQuery = supabase
    .from('checkouts')
    .select(`
      *,
      items(id, name, unit),
      profiles!checkouts_checked_out_by_fkey(full_name, email)
    `)
    .not('checked_in_at', 'is', null)
    .order('checked_in_at', { ascending: false })
    .limit(20);

  if (!isAdmin) {
    historyQuery = historyQuery.eq('checked_out_by', user.id);
  }

  const { data: history } = await historyQuery;

  const now = new Date();
  const overdueCheckouts = (activeCheckouts || []).filter(c =>
    c.expected_return && new Date(c.expected_return) < now
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Checkouts</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'All active checkouts' : 'Your active checkouts'}
        </p>
      </div>

      {/* Overdue Alert */}
      {overdueCheckouts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">{overdueCheckouts.length} overdue checkout{overdueCheckouts.length > 1 ? 's' : ''}</p>
            <p className="text-sm text-red-700">Some items are past their expected return date.</p>
          </div>
        </div>
      )}

      {/* Active Checkouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight className="h-4 w-4" />
            Active ({activeCheckouts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeCheckouts?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active checkouts</p>
          ) : (
            <div className="space-y-2">
              {activeCheckouts.map((c: any) => {
                const isOverdue = c.expected_return && new Date(c.expected_return) < now;
                return (
                  <div key={c.id} className={cn(
                    'p-3 rounded-lg border',
                    isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-100'
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/items/${c.items?.id}`} className="font-medium text-sm hover:underline">
                          {c.items?.name || 'Unknown item'}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {c.quantity} {c.items?.unit} · by {c.profiles?.full_name || c.profiles?.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Out since: {formatDateTime(c.created_at)}
                        </p>
                        {c.expected_return && (
                          <p className={cn('text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                            {isOverdue ? 'OVERDUE · ' : 'Return by: '}
                            {formatDateTime(c.expected_return)}
                          </p>
                        )}
                        {c.purpose && <p className="text-xs text-muted-foreground">Purpose: {c.purpose}</p>}
                      </div>
                      <Badge variant={isOverdue ? 'danger' : 'warning'}>Out</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Returns</CardTitle>
        </CardHeader>
        <CardContent>
          {!history?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No checkout history</p>
          ) : (
            <div className="space-y-2">
              {history.map((c: any) => (
                <div key={c.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/items/${c.items?.id}`} className="font-medium text-sm hover:underline">
                      {c.items?.name || 'Unknown item'}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {c.quantity} {c.items?.unit} · Returned {formatDateTime(c.checked_in_at)}
                    </p>
                  </div>
                  <Badge variant="success">Returned</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
