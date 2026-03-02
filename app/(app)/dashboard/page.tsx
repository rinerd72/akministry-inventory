import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, ArrowLeftRight, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const [itemsResult, checkoutsResult, logsResult, profilesResult] = await Promise.all([
    supabase.from('items').select('id, quantity, min_quantity').is('deleted_at', null),
    supabase.from('checkouts').select('id').is('checked_in_at', null),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
    profile?.role === 'admin' ? supabase.from('profiles').select('id').eq('is_active', true) : Promise.resolve({ data: null }),
  ]);

  const items = itemsResult.data || [];
  const totalItems = items.length;
  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);
  const activeCheckouts = checkoutsResult.data?.length || 0;
  const activeUsers = profilesResult.data?.length || 0;
  const logs = logsResult.data || [];

  // Fetch low stock item details
  const { data: lowStockDetails } = await supabase
    .from('items')
    .select('id, name, quantity, min_quantity, unit')
    .lte('quantity', supabase.rpc('zero' as any))
    .is('deleted_at', null)
    .limit(5);

  // Fetch actual low stock
  const { data: lowStockItemsFull } = await supabase
    .from('items')
    .select('id, name, quantity, min_quantity, unit, categories(name, color)')
    .is('deleted_at', null);

  const lowStock = (lowStockItemsFull || [])
    .filter((i: any) => i.quantity <= i.min_quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your inventory overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out on Loan</p>
                <p className="text-2xl font-bold">{activeCheckouts}</p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {profile?.role === 'admin' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{activeUsers}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are well-stocked!</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((item: any) => (
                  <Link key={item.id} href={`/items/${item.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Min: {item.min_quantity} {item.unit}</p>
                    </div>
                    <Badge variant={item.quantity === 0 ? 'danger' : 'warning'}>
                      {item.quantity} {item.unit}
                    </Badge>
                  </Link>
                ))}
                {lowStockItems.length > 5 && (
                  <Link href="/items?stock=low" className="text-sm text-blue-600 hover:underline block text-center pt-2">
                    View all {lowStockItems.length} items
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 py-1">
                    <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      log.action === 'CHECKOUT' ? 'bg-orange-400' :
                      log.action === 'CHECKIN' ? 'bg-green-400' :
                      log.action === 'DELETE' ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{log.actor_email?.split('@')[0] || 'System'}</span>
                        {' '}{log.action.toLowerCase()}d {log.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
